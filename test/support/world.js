const supertest = require('supertest');
const { setWorldConstructor } = require('cucumber');
const _ = require('lodash');

let history = {};

class World {

    constructor() {
        this.agent = supertest.agent(require('../../build/index'));
        this.mocks = [];
        this.headers = new Set();
        this.history = history;
        this.body = {};
    }

    setMock(mock) {
        this.mocks = [...this.mocks, mock];
    }

    setHeader(name, value) {
        this.headers.add({ name, value });
    }

    setCookie(name, value) {
        value = this.parseTemplateString(value);
        this.agent.jar.setCookie(`${name}=${value}`);
    }

    parseTemplateString(string) {
        let template = string.match(/{{\s?(\S*)\s?}}/);

        if (template instanceof Array) {
            let history;
            let target = template[1].split('.');
            let request = target.shift();
            let parts = request.match(/\[(\d+)\]/);

            if (parts) {
                history = this.getHistory(request.replace(parts[0], ''), parts[1] - 1);
            } else {
                history = this.getHistory(request)['response'];
            }

            target.forEach((field) => {
                let subArray = field.match(/\[(\d+)\]/);
                if (subArray) {
                    field = field.replace(subArray[0], '');
                    history = history[field][subArray[1] - 1];
                } else {
                    history = history[field];
                }
            });

            string = string.replace(template[0], history);
            string = this.parseTemplateString(string);
        }
        return string;
    }

    getHashes(data) {
        let cleaned = [];
        let rows = data.hashes();

        for (let row of rows) {
            for (let hash in row) {
                if (!row[hash] || row[hash] === '') {
                    delete row[hash];
                    continue;
                }

                row[hash] = this.parseTemplateString(row[hash]);

                const keywords = row[hash].match(/^([\S\s]*?)(NOW|TODAY|PASSWORD|NULL)(\((\S*)\))?$/);
                const keyword = keywords ? keywords[2] : row[hash];

                switch (keyword) {
                    case 'NULL':
                        delete row[hash];
                        continue;
                }

                try {
                    let parsed = JSON.parse(row[hash]);
                    row[hash] = parsed;
                } catch (ex) {
                }
            }
            cleaned = [...cleaned, row];
        }
        return cleaned;
    }

    getHistory(name, row) {
        if (row !== undefined) {
            return this.history[name][row];
        }
        return this.history[name];
    }

    processResponse(res, storage) {
        if (this.mocks.length > 0) {
            this.mocks.forEach((mock) => mock.done());
        }

        let data = {
            status: res.statusCode,
            headers: res.headers,
        };

        try {
            data.response = JSON.parse(res.text);
        } catch (ex) {
            data.response = res.text || res.body;
        }

        if (storage) {
            this.history[storage] = data;
        }
    }

    performGet(endpoint, storage) {
        return new Promise((resolve, reject) => {
            const uri = this.parseTemplateString(endpoint);
            const request = this.agent.get(uri);

            this.headers.forEach((header) => request.set(header.name, header.value));
            request.expect((res) => this.processResponse(res, storage));
            request.end((err, res) => err ? reject(err) : resolve(res));
        });
    }

    buildPost(type, field, endpoint, data, storage) {
        const namespace = `${storage}-${endpoint}`;
        return new Promise((resolve, reject) => {
            if (!this.body[namespace]) {
                this.body[namespace] = {};
            }

            switch(type) {
                case 'property':
                    _.set(this.body[namespace], field, data[field]);
                break;
                default:
                    _.set(this.body[namespace], field, data);
            }

            resolve();
        });
    }

    sendPost(endpoint, storage) {
        const namespace = `${storage}-${endpoint}`;
        return new Promise((resolve, reject) => {
            const uri = this.parseTemplateString(endpoint);
            const request = this.agent.post(uri);

            this.headers.forEach((header) => request.set(header.name, header.value));
            request.send(this.body[namespace]);
            request.expect((res) => this.processResponse(res, storage));
            request.end((err, res) => err ? reject(err) : resolve(res));
        });
    }

    performPost(endpoint, data, storage) {
        return new Promise((resolve, reject) => {
            const uri = this.parseTemplateString(endpoint);
            const request = this.agent.post(uri);

            this.headers.forEach((header) => request.set(header.name, header.value));
            request.send(data);
            request.expect((res) => this.processResponse(res, storage));
            request.end((err, res) => err ? reject(err) : resolve(res));
        });
    }
}

setWorldConstructor(World);

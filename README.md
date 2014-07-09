norikra-query-chain-editor (QCE)
==========================

norikra query-chain editor.(QCE)

![norikra qce screenshot](https://gist.githubusercontent.com/ixixi/aa8a47ba6252230fccd2/raw/9b2c58ac6b7cf8f967a9e1ed2d3f8ab6f8a76d88/screenshot.jpg)

## Features

* fetch query chain from norikra
* sync query chain
* visualize LOOPBACK query chain as network graphs
* edit query chains
* import/export query chains (json)

## Install and Execute

### Setup and Build

```bash
$ git clone https://github.com/ixixi/norikra-query-chain-editor
$ cd norikra-query-chain-editor
$ npm install
$ bower install
```

QCE uses Norikra REST APIs. To use QCE, Norikra have to allow CORS requests or QCE server have to be mounted on the same origin.

* allow CORS requests
https://github.com/ixixi/norikra/commit/2a847f5cb3080561a7af419036ee6568be5c400f

and run qce as standalone. `$ grunt serve:dist`

* or mount QCE on the same origin

```bash
$ grunt build
$ ln -s /path/to/norikra-query-chain-editor/dist /path/to/norikra/public/qce
```

and access here.
`http://norikra.server:26578/qce/index.html`

## TODO

* detect conflict
* merge query
* add/remove query

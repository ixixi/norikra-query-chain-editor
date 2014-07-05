norikra-query-chain-editor (QCE)
==========================

norikra query-chain editor.(QCE)

![norikra qce screenshot](https://gist.githubusercontent.com/ixixi/aa8a47ba6252230fccd2/raw/6bb35c75e64cfa29220782eef3d0f32974194d37/screenshot.png)


## Features

* fetch query chain from norikra
* merge query chain
* visualize LOOPBACK query chain as network graphs
* edit query chains
* import/export query chains (json)

## Install and Execute

```bash
$ git clone https://github.com/ixixi/norikra-query-chain-editor
$ cd norikra-query-chain-editor
$ npm install
$ bower install
```

QCE uses Norikra REST APIs. To use QCE, Norikra have to allow CORS requests or QCE server is on same origin.

* add CORS header
https://github.com/ixixi/norikra/commit/acac6290889e3cdb7895ee5dd1f6de35667406d7

and run qce. `$ grunt server`

* mount as same origin

```bash
ln -s /path/to/norikra-query-chain-editor /path/to/norikra/public/qce
```

and access here.
`http://norikra.server:26578/qce/app/index.html`

## TODO

* show diff
* detect conflict
* push query chains to norikra server

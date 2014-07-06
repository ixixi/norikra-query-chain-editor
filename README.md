norikra-query-chain-editor (QCE)
==========================

norikra query-chain editor.(QCE)

![norikra qce screenshot](https://gist.githubusercontent.com/ixixi/aa8a47ba6252230fccd2/raw/575f97918ecc4bd48c88afedf0f56e75180e6028/screenshot.png)


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

QCE uses Norikra REST APIs. To use QCE, Norikra have to allow CORS requests or QCE server have to be mounted on the same origin.

* allow CORS requests
https://github.com/ixixi/norikra/commit/2a847f5cb3080561a7af419036ee6568be5c400f

and run qce. `$ grunt server`

* or mount QCE on the same origin

```bash
ln -s /path/to/norikra-query-chain-editor /path/to/norikra/public/qce
```

and access here.
`http://norikra.server:26578/qce/app/index.html`

## TODO

* show diff
* detect conflict
* push query chains to norikra server

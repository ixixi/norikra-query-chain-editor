'use strict';

var SHA1 = new Hashes.SHA1();

var setting = {
    GRAPH_PARAM: {
        INPUT_LENGTH : 250,
        QUERY_TARGET_LENGTH : 200,
        QUERY_LOOPBACK_LENGTH : 120
    },
    GRAPH_OPTIONS: {
        stabilize: true,
        edges: {
            length: 120,
            width: 2,
            style: 'arrow',
            color: '#75B08A'
        },
        nodes: {
            // default for all nodes
            shape: 'circle',
            color: {
                border: 'orange',
                background: 'yellow',
                highlight: {
                    border: 'darkorange',
                    background: 'gold'
                }
            }
        },
        groups: {
            root: {
                // defaults for nodes in this group
                radiusMin: 30,
                color: '#A2475E',
                fontColor: 'white',
                fontSize: 25,
                shape: 'star'
            },
            query: {
                // defaults for nodes in this group
                radius: 15,
                color: '#FF9D84',
                fontColor: 'white',
                fontSize: 18,
                shape: 'rect'
            },
            target: {
                color: {
                    border: 'black',
                    background: 'gray',
                    highlight: {
                        border: 'black',
                        background: 'lightgray'
                    }
                },
                fontColor: 'white',
                fontSize: 18,
                radiusMin: 30,
                shape: 'square'
            },
            white: {
                color: {
                    border: 'black',
                    background: 'white'
                },
                fontColor: 'red',
                shape: 'image',
                image: 'img/soft-scraps-icons/User-Coat-Blue-icon.png'
            }
        }
    }
};

var LOG_TYPE = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

Vue.filter(
    'jsonStringify',function(val){
        return JSON.stringify(val);
    });

Vue.filter(
    'tail', function(arr,num){
        return arr.slice(-num);
    }
);

var qce  = new Vue({
    el: '#qce',

    ready:function(){
        //this.$watch('selectedQuery1',function(){
        //    console.log('selected:'+this.selectedQuery1)
        //    this.showDiff();
        //}),
        //    this.$watch('selectedQuery2',function(){
        //        console.log('selected2:'+this.selectedQuery2);
        //        this.showDiff();
        //     })
    },
    data: {
        title: 'Norikra query chain editor',
        nodes:[],
        edges:[],
        expression: '',
        queryName: '',
        queryGroup: '',
        queryNameBefore: '',
        host: 'localhost',
        port: '26578',
        loaded: false,
        localHash: '',
        serverHash: '',
        editOriginHash: '',
        committedHash: '',
        selectedQuery1: 'Server',
        selectedQuery2: 'Last Committed',
        serverQueries: [],
        editOriginQueries: [],
        localQueries: [],
        committedQueries: [],
        diffView: '',
        diffData:{},
        logs: [],
        selectMap : {
            'Server': function(){return qce.serverQueries;},
            'Edit Origin': function(){return qce.editOriginQueries;},
            'Local': function(){return qce.localQueries;},
            'Last Committed': function(){return qce.committedQueries;}
        }
    },
    methods: {
        getPushQueries: function(){
            var diffData = this.diff(this.selectMap['Server'](),this.selectMap['Last Committed']());
            return diffData;
        },
        showDiff: function(){
            if (!(this.selectedQuery1&&this.selectedQuery2)){
                return;
            }
            var from = this.selectMap[this.selectedQuery1]();
            var to = this.selectMap[this.selectedQuery2]();
            this.diffData = this.diff(from,to);
            this.diffView = JSON.stringify(this.diffData,null,4);
        },
        normalizedHash: function(rawQueries) {
            if (rawQueries === null) {
                return '';
            }
            var sortedQueries = _.sortBy(rawQueries, function (q) {
                return q.name;
            });
            return SHA1.hex(JSON.stringify(sortedQueries)).slice(0,7);
        },
        draw: function(){
            var graph = new vis.Graph(
                document.getElementById('query-chain'),
                {nodes: this.nodes,edges: this.edges},
                setting.GRAPH_OPTIONS);

            function onSelect (properties) {
                if (properties.nodes.length===1){
                    var selectNode = _.find(qce.nodes,function(v){return v.id === properties.nodes[0];});
                    if (selectNode.group==='query') {
                        $('#editor').show();
                        qce.expression = selectNode.expression;
                        qce.queryName = selectNode.label;
                        qce.queryNameBefore = selectNode.label;
                        qce.queryGroup = selectNode.qgroup;
                    }
                }else{
                    $('#editor').hide();
                }


            }

            graph.on('select', onSelect);

        },
        diff: function(queries1,queries2){
            var addedQueries = _.filter(queries2,function(q2){
                return _.find(queries1,function(q1){
                    return q2.name===q1.name;})===undefined ;});
            var removedQueries = _.filter(queries1,function(q1){
                return _.find(queries2,function(q2){
                    return q1.name===q2.name;})===undefined ;});
            var commonQueries = _.reject(_.map(queries1,function(q1){
                    return {before:q1,after: _.find(queries2,function(q2){return q1.name===q2.name;})};}),
                function(d){return d.after===undefined;});

            var updatedQueries = _.filter(commonQueries,function(cq){
                return !_.isEqual(cq.before,cq.after);
            });
            return {
                addedQueries: addedQueries,
                removedQueries: removedQueries,
                updatedQueries: updatedQueries
            };
        },
        saveQueriesLocalStorage: function(){
            localStorage.setItem('savedLocalQueries',JSON.stringify(this.localQueries));
            localStorage.setItem('savedEditOriginQueries',JSON.stringify(this.localQueries));
        },

        loadQueriesLocalStorage: function(){
            this.localQueries = JSON.parse(localStorage.getItem('savedLocalQueries'));
            this.committedQueries = JSON.parse(localStorage.getItem('savedLocalQueries'));
            this.editOriginQueries = JSON.parse(localStorage.getItem('savedEditOriginQueries'));
            this.displayQueries(this.localQueries);
            this.updateHash();
            qce.loaded = true;
        },
        updateHash: function(){
            this.localHash = this.normalizedHash(this.localQueries);
            this.serverHash = this.normalizedHash(this.serverQueries);
            this.committedHash = this.normalizedHash(this.committedQueries);
            this.editOriginHash = this.normalizedHash(this.editOriginQueries);
        },
        applyEdit: function(){
            var q = _.find(this.localQueries,function(v){return v.name===qce.queryNameBefore});
            q.expression = this.expression;
            q.name = this.queryName;
            q.group = this.queryGroup;
            this.updateHash();
            this.displayQueries(this.localQueries);
        },
        fetchQueries: function() {
            $.getJSON('http://'+this.host+':'+this.port+'/api/queries', function (json) {
                qce.serverQueries = $.extend(true, [], json);
            }).done(function () {
                qce.updateHash();
            }).fail(function () {
            }) .always(function () {
                qce.appendLog(LOG_TYPE.INFO,'fetch queries success.');
            });
        },
        mergeQueries: function(){
            //TODO: merge
            this.editOriginQueries = $.extend(true, [], this.serverQueries);
            this.editOriginHash = this.normalizedHash(this.editOriginQueries);


            this.localQueries = $.extend(true, [], this.editOriginQueries);
            this.updateHash();
            this.displayQueries(this.localQueries);
            qce.appendLog(LOG_TYPE.INFO,'merge queries success.');
        },
        commitQueries: function(){
            this.committedQueries = $.extend(true, [], this.localQueries);
            this.updateHash();
            this.saveQueriesLocalStorage();
            qce.appendLog(LOG_TYPE.INFO,'commit queries success.');
        },
        pushQueries: function(){
            //TODO: implement
        },
        registerQuery: function(query){
            var urlBase = 'http://'+this.host+':'+this.port+'/api';
            var registerQuery = {
                query_name : query.name,
                query_group : query.group,
                expression : query.expression
            };
            $.ajax(
                {
                    type:'post',
                    url: urlBase+'/register',
                    data:JSON.stringify(registerQuery),
                    contentType: 'application/json',
                    dataType:'json',
                    success: function(result) {
                        qce.appendLog(LOG_TYPE.INFO,'registerQuery: "'+ query.name +'" seccuess.');
                    },
                    error: function(result) {
                        var res = result.responseJSON;
                        qce.appendLog(LOG_TYPE.ERROR,'registerQuery: "'+ query.name +'" failed. { ' + res.error +' | '+ res.message +' }' );
                    },
                    complete: function() {
                        qce.fetchQueries();
                    }
                }
            );
        },
        deregisterQuery: function(query){
            var urlBase = 'http://'+this.host+':'+this.port+'/api';
            var deregisterQuery = {
                query_name : query.name
            };
            $.ajax(
                {
                    type:'post',
                    url: urlBase+'/deregister',
                    data:JSON.stringify(deregisterQuery),
                    contentType: 'application/json',
                    dataType:'json',
                    success: function(result) {
                        qce.appendLog(LOG_TYPE.INFO,'deregisterQuery: "'+ query.name +'" seccuess.');
                    },
                    error: function(result) {
                        var res = result.responseJSON;
                        qce.appendLog(LOG_TYPE.ERROR,'deregisterQuery: "'+ query.name +'" failed. { ' + res.error +' | '+ res.message +' }' );
                    },
                    complete: function() {
                        qce.fetchQueries();
                    }
                }
            );
        },
        forcePushQueries: function(){
            var diffQueries = this.getPushQueries();
            _.each(diffQueries.addedQueries,function(q){
                qce.registerQuery(q);
            });
            _.each(diffQueries.removedQueries,function(q){
                qce.deregisterQuery(q);
            });
            _.each(diffQueries.updatedQueries,function(q){
                qce.deregisterQuery(q.before);
                qce.registerQuery(q.after);
            });
            this.fetchQueries();
        },
        forcePushQuery: function(){

        },
        resetToServer: function(){
            this.localQueries = $.extend(true, [], this.serverQueries);
            this.editOriginQueries = $.extend(true, [], this.serverQueries);
            this.updateHash();
            qce.appendLog(LOG_TYPE.INFO,'reset to Server.');
        },
        resetToEditOrigin: function(){
            this.localQueries = $.extend(true, [], this.editOriginQueries);
            this.updateHash();
            qce.appendLog(LOG_TYPE.INFO,'reset to edit origin.');
        },
        resetToCommitted: function(){
            this.localQueries = $.extend(true, [], this.committedQueries);
            this.updateHash();
            qce.appendLog(LOG_TYPE.INFO,'reset to last commit.');
        },
        exportQueries: function(){
            var uriContent = 'data:application/octet-stream,' + encodeURIComponent(JSON.stringify(this.localQueries,undefined,4));
            var myWindow = window.open(uriContent, 'NorikraQueryChain');
            myWindow.focus();
            qce.appendLog(LOG_TYPE.INFO,'export queries.');
        },
        importQueries: function(){
            var f = $('#import-file').prop('files')[0];
            if (f) {
                var r = new FileReader();
                r.onload = function(e) {
                    var contents = e.target.result;
                    qce.localQueries = JSON.parse(contents);
                    qce.updateHash();
                    qce.displayQueries(qce.localQueries);
                };
                r.readAsText(f);
            } else {
                alert('Failed to load file');
            }
            qce.appendLog(LOG_TYPE.INFO,'import queries.');
        },
        appendLog: function(type,message,time){
            var logTime = time || moment().format('YYYY/MM/DD HH:mm:ss');
            this.logs.push({time:logTime,type:type,message:message});
        },
        displayQueries: function(queries){
            this.nodes = [];
            this.edges = [];
            var findNodeId = function (label) {
                return _.find(qce.nodes, function (v) {
                    return v.label === label;
                }).id;
            };

            var rootNode = {id: 0, label: 'stream source', group: 'root', value: 'root', title: 'stream data input'};
            this.nodes.push(rootNode);

            var queryNodes = _.map(queries, function (d, i) {
                return {id: 'q-' + (i + 1), label: d.name, group: 'query', qgroup: d.group, expression: d.expression };
            });


            var loopback = function (v) {
                return v.group ? v.group.match(/LOOPBACK\((.+)\)/)[1] : null;
            };

            var targetNodes = _.map(
                _.uniq(_.flatten(
                    _.map(queries, function (d) {
                        return d.targets;
                    })).concat(
                    _.map(_.filter(queries, function (d) {
                        return loopback(d);
                    }), function (d) {
                        return loopback(d);
                    })
                )), function (t, i) {
                    return {id: 't-' + (i + 1), label: t, group: 'target', type: 'target'};
                });

            this.nodes.push(queryNodes);
            this.nodes.push(targetNodes);
            this.nodes = _.flatten(this.nodes);


            _.each(queries, function (d) {
                _.each(d.targets, function (v) {
                    qce.edges.push({from: findNodeId(v), to: findNodeId(d.name), name: v, length: setting.GRAPH_PARAM.QUERY_TARGET_LENGTH});
                });
                if (loopback(d)) {
                    qce.edges.push({from: findNodeId(d.name), to: findNodeId(loopback(d)), length: setting.GRAPH_PARAM.QUERY_LOOPBACK_LENGTH});
                }
            });


            var loopbackTargets = _.filter(_.map(queries, function (d) {
                return loopback(d);
            }), function (v) {
                return v !== null;
            });


            var inputTargets = _.reject(_.uniq(_.flatten(_.map(queries, function (d) {
                    return d.targets;
                }))),
                function (t) {
                    return _.contains(loopbackTargets, t);
                });

            _.each(inputTargets, function (t) {
                qce.edges.push({from: 0, to: findNodeId(t), label: 'input', groups: 'input', length: setting.GRAPH_PARAM.INPUT_LENGTH});
            });
            this.draw();
        }
    }
});





$(document).ready(function () {
    $('#fetch').click(function () {
        qce.fetchQueries();
    });
    $('#merge').click(function () {
        qce.mergeQueries();
    });
    $('#commit').click(function () {
        qce.commitQueries();
    });
    $('#push').click(function () {
        qce.pushQueries();
    });
    $('#push-force').click(function () {
        qce.forcePushQueries();
    });
    $('#import').click(function () {
        qce.importQueries();
    });
    $('#export').click(function () {
        qce.exportQueries();
    });
    $('#apply').click(function () {
        qce.applyEdit();
    });
    $('#reset-server').click(function () {
        qce.resetToServer();
    });
    $('#reset-edit-origin').click(function () {
        qce.resetToEditOrigin();
    });
    $('#reset-committed').click(function () {
        qce.resetToCommitted();
    });
    $('#show-diff').click(function () {
        qce.showDiff();
    });
});

$(function(){
    qce.loadQueriesLocalStorage();
    qce.fetchQueries();
});

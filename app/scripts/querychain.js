var SHA1 = new Hashes.SHA1;

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

var norichain  = new Vue({
    el: '#norichain',

    ready:function(){
        this.$watch('selectedQuery1',function(){
            console.log('selected:'+this.selectedQuery1)
            this.showDiff();
        }),
            this.$watch('selectedQuery2',function(){
                console.log('selected2:'+this.selectedQuery2);
                this.showDiff();
            })
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
        selectedQuery1:null,
        selectedQuery2:null,
        serverQueries: [],
        editOriginQueries: [],
        localQueries: [],
        committedQueries: [],
        diffView: '',
        selectMap : {
            'Server': function(){return norichain.serverQueries;},
            'Edit Origin': function(){return norichain.editOriginQueries;},
            'Local': function(){return norichain.localQueries;},
            'Last Committed': function(){return norichain.committedQueries;}
        }
    },
    methods: {
        showDiff: function(){
            if (!(this.selectedQuery1&&this.selectedQuery2)){
                return;
            }
            var from = this.selectMap[this.selectedQuery1]();
            var to = this.selectMap[this.selectedQuery2]();
            var diffData = this.diff(from,to);
            console.log(diffData);
            this.diffView = JSON.stringify(diffData);
        },
        normalizedHash: function(rawQueries) {
            console.log('normalizedHash');
            if (rawQueries == null) {
                return '';
            }
            console.log(rawQueries);
            var sortedQueries = _.sortBy(rawQueries, function (q) {
                return q.name;
            });
            console.log(sortedQueries);
            return SHA1.hex(JSON.stringify(sortedQueries)).slice(0,7);
        },
        draw: function(){
            var graph = new vis.Graph(
                document.getElementById('query-chain'),
                {nodes: this.nodes,edges: this.edges},
                setting.GRAPH_OPTIONS);

            function onSelect (properties) {
                console.log(properties.nodes);
                if (properties.nodes.length==1){
                    selectNode = _.find(norichain.nodes,function(v){return v.id ==properties.nodes[0];});
                    console.log(selectNode);
                    if (selectNode.group==='query') {
                        $('#editor').show();
                        norichain.expression = selectNode.expression;
                        norichain.queryName = selectNode.label;
                        norichain.queryNameBefore = selectNode.label;
                        norichain.queryGroup = selectNode.qgroup;
                    }
                }else{
                    $('#editor').hide();
                }


            }

            graph.on('select', onSelect);

        },
        diff: function(queries1,queries2){
            console.log('queries1');
            console.log(JSON.stringify(queries1));
            console.log('queries2');
            console.log(JSON.stringify(queries2));
            var addedQueries = _.filter(queries2,function(q2){
                return _.find(queries1,function(q1){
                    return q2.name==q1.name;})===undefined ;});
            var removedQueries = _.filter(queries1,function(q1){
                return _.find(queries2,function(q2){
                    return q1.name==q2.name;})===undefined ;});
            console.log(addedQueries);
            console.log(removedQueries);
            var commonQueries = _.reject(_.map(queries1,function(q1){
                    return {before:q1,after: _.find(queries2,function(q2){return q1.name===q2.name;})}}),
                function(d){return d.after===undefined;});

            console.log(commonQueries);
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
            norichain.loaded = true;
        },
        updateHash: function(){
            this.localHash = this.normalizedHash(this.localQueries);
            this.serverHash = this.normalizedHash(this.serverQueries);
            this.committedHash = this.normalizedHash(this.committedQueries);
            this.editOriginHash = this.normalizedHash(this.editOriginQueries);
        },
        applyEdit: function(){
            console.log(this.localQueries);
            var q = _.find(this.localQueries,function(v){return v.name===norichain.queryNameBefore});
            console.log(q);
            q.expression = this.expression;
            q.name = this.queryName;
            q.group = this.queryGroup;
            this.updateHash();
            this.displayQueries(this.localQueries);
        },
        fetchQueries: function() {
            $.getJSON("http://"+this.host+":"+this.port+"/api/queries", function (json) {
                norichain.serverQueries = $.extend(true, [], json);
                norichain.updateHash()
            }).done(function () {
                console.log("query load success");
            }).fail(function () {
                console.log("error");
            }) .always(function () {
                console.log("query load complete");
            });
        },
        mergeQueries: function(){
            //if (_.isEqual(this.serverQueries,queries)){
            //    console.log("eq!");
            //}

            //TODO: merge
            this.editOriginQueries = $.extend(true, [], this.serverQueries);
            this.editOriginHash = this.normalizedHash(this.editOriginQueries);


            this.localQueries = $.extend(true, [], this.editOriginQueries);
            this.updateHash();
            this.displayQueries(this.localQueries);
        },
        commitQueries: function(){
            this.committedQueries = $.extend(true, [], this.localQueries);
            this.updateHash();
            this.saveQueriesLocalStorage();
        },
        pushQueries: function(){
            //TODO: implement
        },
        resetToServer: function(){
            this.localQueries = $.extend(true, [], this.serverQueries);
            this.editOriginQueries = $.extend(true, [], this.serverQueries);
            this.updateHash();
        },
        resetToEditOrigin: function(){
            this.localQueries = $.extend(true, [], this.editOriginQueries);
            this.updateHash();
        },
        resetToCommitted: function(){
            this.localQueries = $.extend(true, [], this.committedQueries);
            this.updateHash();
        },
        exportQueries: function(){
            var uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(this.localQueries,undefined,4));
            var myWindow = window.open(uriContent, "NorikraQueryChain");
            myWindow.focus();
        },
        importQueries: function(){
            var f = $('#import-file').prop('files')[0];
            if (f) {
                var r = new FileReader();
                r.onload = function(e) {
                    var contents = e.target.result;
                    norichain.localQueries = JSON.parse(contents);
                    norichain.updateHash();
                    norichain.displayQueries(norichain.localQueries);
                }
                r.readAsText(f)
            } else {
                alert("Failed to load file");
            }
        },
        displayQueries: function(queries){
            this.nodes = [];
            this.edges = [];
            var findNodeId = function (label) {
                return _.find(norichain.nodes, function (v) {
                    return v.label == label;
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
                    norichain.edges.push({from: findNodeId(v), to: findNodeId(d.name), name: v, length: setting.GRAPH_PARAM.QUERY_TARGET_LENGTH});
                })
                if (loopback(d)) {
                    norichain.edges.push({from: findNodeId(d.name), to: findNodeId(loopback(d)), length: setting.GRAPH_PARAM.QUERY_LOOPBACK_LENGTH});
                }
            });


            var loopbackTargets = _.filter(_.map(queries, function (d) {
                return loopback(d);
            }), function (v) {
                return v != null
            });


            var inputTargets = _.reject(_.uniq(_.flatten(_.map(queries, function (d) {
                    return d.targets;
                }))),
                function (t) {
                    return _.contains(loopbackTargets, t);
                });

            _.each(inputTargets, function (t) {
                norichain.edges.push({from: 0, to: findNodeId(t), label: 'input', groups: 'input', length: setting.GRAPH_PARAM.INPUT_LENGTH});
            });
            this.draw();
        }
    }
});





$(document).ready(function () {
    $("#fetch").click(function () {
        norichain.fetchQueries();
    });
    $("#merge").click(function () {
        norichain.mergeQueries();
    });
    $("#commit").click(function () {
        norichain.commitQueries();
    });
    $("#push").click(function () {
        norichain.pushQueries();
    });
    $("#import").click(function () {
        norichain.importQueries();
    });
    $("#export").click(function () {
        norichain.exportQueries();
    });
    $("#apply").click(function () {
        norichain.applyEdit();
    });
    $("#reset-server").click(function () {
        norichain.resetToServer();
    });
    $("#reset-edit-origin").click(function () {
        norichain.resetToEditOrigin();
    });
    $("#reset-committed").click(function () {
        norichain.resetToCommitted();
    });
});

console.log(norichain.serverQueries);

norichain.loadQueriesLocalStorage();




var Const ={
    MAX_LENGTH:600,
    MOOD_ORDER : ['negative','positive'],
    MOOD_MAP : ['殺伐度','賞賛度'],
    LABEL_ORDER : ['unknown',
        'aaah','meirei','c2c', 'salute','tsukkomi','url','cry','wktk',
        'response','greeting','hihan',
        'arashi',
        'bougen','shokunin','question','request','great','good','lol','excite'],

    LABEL_MAP : {
        unknown: 'その他  ', lol: '笑い ', excite: '興奮 ', arashi: '荒らし  ', aaah: '絶叫 ',
        meirei: '命令 ', hihan: '批判 ', c2c: 'コメ話  ', salute: '挙手 ', tsukkomi: 'ツッコミ   ',
        shokunin: '職人 ', good: '賞賛 ', great: '驚愕 ', url: 'URL ', cry: '泣き ', request: '要望 ',
        wktk: '期待 ', response: '返事 ', greeting: '挨拶 ', bougen: '暴言 ', question: '質問 '
    }
};

var kotodama  = new Vue({
    el: '#kotodama',
    data: {
        title: 'kotodama',
        msg: _.map(Const.LABEL_ORDER,function(v){
            return {label:v, category:Const.LABEL_MAP[v],count:0,last_message:''};
        })
    }
});

var initialData = function (){
    var now = ~~(new Date/1000);
    var initial = [];
    for (var i=0; i<Const.MAX_LENGTH-1; i++){
        initial.push({x:now-(Const.MAX_LENGTH - i),y:0});
    };
    return initial;
};


var mood_abstract_data ={};
_.each(Const.MOOD_ORDER,function(v){
    mood_abstract_data[v] = initialData();
});


var area_chart_data = {};
_.each(Const.LABEL_ORDER,function(v){
    area_chart_data[v] = initialData();
});

var update_area_chart = function(){

    d3.select('#area-chart svg')
        .datum(area_chart_data)
        .call(area_chart);

    //nv.utils.windowResize(area_chart.update);

};

var graphdata;

var update_donut_chart = function(){
    d3.select("#donut-chart svg")
        .datum(graphdata)
        .transition().duration(150)
        .call(donut_chart);
};


var on_comment_count = function(dat){
    var comment_agg = _.map(dat, function (v, k) {
        return {'label': k, 'value': v};
    });
    var total = _.find(comment_agg, function (v) {
        return v.label === 'total';
    }).value;

    kotodama.cpm = total;
}

var on_mood_score = function(dat){
    //console.log(JSON.stringify(area_chart_series));
    var comment_agg = _.map(dat, function (v, k) {
        return {'label': k, 'value': v};
    });
    graphdata = _.reject(comment_agg, function (v) {
        return v.label === 'total' || v.label === 'live_id' || v.label === 'p';
    });

    _.each(graphdata,function(v){v.category = Const.LABEL_MAP[v.label]});
    graphdata = _.sortBy(graphdata,function(v){
        for(var i=0;i<Const.LABEL_ORDER.length;i++){
            if (v.label === Const.LABEL_ORDER[i]){
                return i;
            }
        }});
    _.each(graphdata,function(v){
        var target_comment_count = _.find(kotodama.msg,
            function(o){return o.label=== v.label;});
        if (target_comment_count){
            target_comment_count.count = Math.round(v.value);
            var target_area_chart_dat = area_chart_data[v.label];
            while (target_area_chart_dat.length>Const.MAX_LENGTH){
                target_area_chart_dat.shift();
            }}
        target_area_chart_dat.push({x: ~~(new Date/1000), y:v.value});
    });

    update_donut_chart();
    //update_area_chart();
    graph.update();

};

var on_mood_abstract_score = function(dat){
    var mood_abstract = _.reject(_.map(dat, function (v, k) {
        return {'label': k, 'value': v};
    }),function(v){
        return v.label === 'total' || v.label === 'live_id' || v.label === 'p';
    });

    _.each(mood_abstract,function(v){
        var target_mood_area_chart_dat = mood_abstract_data[v.label];
        while (target_mood_area_chart_dat.length>Const.MAX_LENGTH){
            target_mood_area_chart_dat.shift();
        }
        target_mood_area_chart_dat.push({x: ~~(new Date/1000), y:v.value});
    });
    graph_mood.update();

}

var on_last_msg = function(dat){
    delete dat['p'];
    //console.log(JSON.stringify(dat));
    _.each(dat,function(v,k){
        var target = _.find(kotodama.msg,
            function(o){return o.label===k;});
        if (target) {
            target.last_message = v;
        }
    });
};

var routing = {
    'result.mood_score': on_mood_score,
    'result.mood_abstract_score': on_mood_abstract_score,
    'result.msg': on_last_msg,
    'result.count': on_comment_count
};
(function() {
    var serverName = '127.0.0.1';
    var socketPort = 25258;
    var ws = new WebSocket("ws://" + serverName + ":" + socketPort + "/socket.io/1/websocket/");
    ws.onmessage = function (e) {
        var data = JSON.parse(e.data);
        var tag = data[0];
        var func = routing[tag];
        if (func){
            func(data[1]);
        }
    };
})();

var donut_chart;
var area_chart;

nv.addGraph(function() {
    donut_chart = nv.models.pieChart()
        .x(function(d) { return d.category; })
        .y(function(d) { return d.value; })
        .showLabels(true)
        .labelThreshold(.01)
        .labelType("percent")
        .donut(true)
        .donutRatio(0.15)
    ;

    return donut_chart;
});

var random = new Rickshaw.Fixtures.RandomData(150);

var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

var area_chart_series = _.map(area_chart_data,function(v,k){
        return {
            color: palette.color(),
            data: v,
            name: Const.LABEL_MAP[k]
        };
    }
);

var mood_abstract_series = _.map(mood_abstract_data,function(v,k){
        return {
            color: palette.color(),
            data: v,
            name: Const.MOOD_MAP[k]
        };
    }
);


var graph = new Rickshaw.Graph( {
    element: document.getElementById("chart"),
    width: 680,
    height: 500,
    renderer: 'area',
    stroke: true,
    preserve: true,
    series: area_chart_series
} );

var graph_mood = new Rickshaw.Graph( {
    element: document.getElementById("mood_chart"),
    width: 680,
    height: 500,
    renderer: 'area',
    stroke: true,
    preserve: true,
    series:  mood_abstract_series
} );

graph.render();
graph_mood.render();

var preview = new Rickshaw.Graph.RangeSlider( {
    graph: graph,
    element: document.getElementById('preview')
} );

var hoverDetail = new Rickshaw.Graph.HoverDetail( {
    graph: graph,
    xFormatter: function(x) {
        return new Date(x * 1000).toString();
    }
} );

var annotator = new Rickshaw.Graph.Annotate( {
    graph: graph,
    element: document.getElementById('timeline')
} );

var legend = new Rickshaw.Graph.Legend( {
    graph: graph,
    element: document.getElementById('legend')

} );

var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
    graph: graph,
    legend: legend
} );

var order = new Rickshaw.Graph.Behavior.Series.Order( {
    graph: graph,
    legend: legend
} );

var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
    graph: graph,
    legend: legend
} );

var smoother = new Rickshaw.Graph.Smoother( {
    graph: graph,
    element: document.querySelector('#smoother')
} );

var ticksTreatment = 'glow';

unit_formatter = {
    name: '60 sec',
    seconds: 60,
    formatter: function(d) {
        return moment(d).format('HH:mm')}
};
var xAxis = new Rickshaw.Graph.Axis.Time( {
    graph: graph,
    ticksTreatment: ticksTreatment,
    timeUnit:unit_formatter
} );

xAxis.render();

var yAxis = new Rickshaw.Graph.Axis.Y( {
    graph: graph,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
    ticksTreatment: ticksTreatment
} );

yAxis.render();


var controls = new RenderControls( {
    element: document.querySelector('form'),
    graph: graph
} );
/*
setInterval( function() {
    for (var i=0 ;i<seriesData.length;i++){
        seriesData[i].push({x: ~~(new Date/1000), y:Math.random(100)});
        seriesData[i].shift();
    }

    graph.update();

}, 1000 );
*/
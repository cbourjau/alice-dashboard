function get_collumn_width(id) {
    var bb = document.querySelector(id).parentNode.getBoundingClientRect();
    width = bb.right - bb.left;
    return width;
}

function cleanData(data) {
    data.forEach(function (el, i) {
	el["counts"] = parseInt(el["counts"]) / 1e6;
	el["run"] = parseInt(el["run"]);
    });
    return data;
}

var ndx;
function create_trigger_plots(fname) {
    d3.csv(fname, function(error, data) {
	cleanData(data);
	ndx    = crossfilter(data);
	var run_of_trigger_dim = ndx.dimension(function(d) {return [d.trigger, d.run];}),
	    run_trigger_group =
	    run_of_trigger_dim.group().reduceSum(function(d) { return d.counts; });
	var run_dim = ndx.dimension(function(d) {return +d.run;}),
	    run_group = run_dim.group().reduceSum(function(d) { return +d.counts; });
	var n_runs = run_group.all().length;
	var heat_map = dc.heatMap("#Triggers");
	var height = n_runs * 10 > 1500 ? n_runs * 10 : 1500;
	heat_map
	    .width(get_collumn_width("#Triggers"))
	    .height(height)
	    .dimension(run_of_trigger_dim)
	    .group(run_trigger_group)
	    .keyAccessor(function(d) {
		return d.key[0]; })
	    .valueAccessor(function(d) {
		return d.key[1]; })
	    .colorAccessor(function(d) {
		return +d.value; })
	    .title(function(d) {
		return "Trigger name: " + d.key[0] + "\n" +
		    "Run: " + d.key[1] + "\n" +
		    "Counts: " + d.value * 1e6 ;})
    	    .margins({ top: 0, left: 41, right: 5, bottom: 170 })
	    .on('postRender', function(chart) {
		chart.selectAll('g.cols.axis > text')
		    .transition().duration(chart.transitionDuration())
		    .style("text-anchor", "end")
		    .attr('transform', function (d) {
			var coord = this.getBBox();
			var x = coord.x + (coord.width/2),
			    y = coord.y + (coord.height/2);
			return "rotate(-90 "+x+" "+y+")";
                    });
	    });
	heat_map.xBorderRadius(0);
	heat_map.yBorderRadius(0);

	var bar_chart = dc.barChart("#BarChart");
	var max_run = run_dim.top(1)[0].run,
	    min_run = run_dim.bottom(1)[0].run;
	bar_chart
            .dimension(run_dim)
            .group(run_group)
	    .width(get_collumn_width("#BarChart"))
            .height(500)
	    .x(d3.scale.ordinal())
	    .xUnits(dc.units.ordinal)
    	    .elasticX(true)
	    .elasticY(true)
    	    .xAxisLabel('Run number')
	    .yAxisLabel('Selected triggers after L2A [x10^6]')

            .margins({ top: 0, left: 50, right: 5, bottom: 90 })
    	    .on('renderlet', function (chart)
		{chart
		 .selectAll("g.x text")
		 .attr("dx", "-0.8em")
		 .attr("dy", "-0.5em")
		 .attr('transform', "rotate(-90)")
		 .style("text-anchor", "end");}); 
	dc.renderAll();
    });
};
create_trigger_plots("./data/triggers_period/triggers_per_run_LHC16l.csv");

function load_period(period) {
    return function (){
	var path = "./data/triggers_period/triggers_per_run_" + period + ".csv";
	create_trigger_plots(path);
    };
};

var periodSelect = document.getElementById("periodSelect");
function changeFunc() {
    var selectedValue = periodSelect.options[periodSelect.selectedIndex].value;
    load_period(selectedValue)();
}

var periods = ["LHC10b", "LHC10c", "LHC10d", "LHC10e", "LHC10f", "LHC10g", "LHC10h", "LHC11a", "LHC11b", "LHC11c", "LHC11d", "LHC11e", "LHC11f", "LHC11h", "LHC12a", "LHC12b", "LHC12c", "LHC12d", "LHC12e", "LHC12f", "LHC12g", "LHC12h", "LHC12i", "LHC13b", "LHC13c", "LHC13d", "LHC13e", "LHC13f", "LHC13g", "LHC15f", "LHC15g", "LHC15h", "LHC15i", "LHC15j", "LHC15k", "LHC15l", "LHC15n", "LHC15o", "LHC16b", "LHC16d", "LHC16e", "LHC16f", "LHC16g", "LHC16h", "LHC16i", "LHC16j", "LHC16k", "LHC16l", "LHC16m", "LHC16n", "LHC16o", "LHC16p", "LHC16q", "LHC16r", "LHC16s", "LHC16t"];

for (iperiod in periods) {
    var opt = document.createElement("option");
    opt.value= periods[iperiod];
    opt.innerHTML = periods[iperiod];
    periodSelect.appendChild(opt);
}

periodSelect.addEventListener("change", changeFunc); 

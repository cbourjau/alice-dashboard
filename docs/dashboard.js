var xfitter_runs;

var dashboardTutorial = (function () {

    // var parseDate = function (d) {
    //     return new Date('20' + d.substring(6),
    //         d.substring(3, 5),
    //         d.substring(0, 2));
    // };

    triggers = [
	// 'C0VHM-B-NOPF-CENT',
	// 'C0VHM-B-NOPF-CENTNOPMD',
	// 'C0VHM-B-NOPF-CENTNOTRD',
	// 'C0VHM-B-NOPF-MUFAST',
	// 'CINT7-B-NOPF-ALL',
	// 'CINT7-B-NOPF-ALLNOTRD',
	// 'CINT7-B-NOPF-CALOFAST',
	'CINT7-B-NOPF-CENT',
	'CINT7-B-NOPF-CENTNOTRD',
	// 'CINT7-B-NOPF-EMCALPHOS',
	// 'CINT7-B-NOPF-FAST',
	// 'CINT7-B-NOPF-FASTNOTRD',
	'CINT7-B-NOPF-MUFAST',
	// 'CINT7-B-NOPF-MUON',
	// 'CINT7-B-NOPF-PHOSCPV',
	// 'CINT7-B-NOPF-UFAST',
	// 'CINT7PHM-B-NOPF-CENTNOPMD',
	// 'CINT7PHM-B-NOPF-CENTNOTRD',
	// 'CINT8PHM-B-NOPF-CENTNOTRD',
	// 'CPER7PHM-B-NOPF-CENTNOPMD',
	// 'CPHI7PHM-B-NOPF-CALOFAST',
	// 'CPHI7PHM-B-NOPF-CENT',
	// 'CPHI7PHM-B-NOPF-CENTNOPMD',
	// 'CPHI7PHM-B-NOPF-CENTNOTRD',
	// 'CSHM7-B-NOPF-CENT',
	// 'CSHM7-B-NOPF-CENTNOTRD',
	// 'CSHM7-B-spd1-CENT',
	// 'CSHM7-B-spd1-CENTNOTRD',
	// 'CVHMEJ1-B-NOPF-CENTNOPMD',
	// 'CVHMPHH-B-NOPF-CENTNOPMD',
	// 'CVHMSH1-B-NOPF-CENT',
	// 'CVHMSH2-B-NOPF-CENT',
	// 'CVHMSH2-B-NOPF-CENTNOTRD',
	// 'CVHMSH2-B-SPD1-CENT',
	// 'CVHMSH2-B-SPD1-CENTNOTRD',
	// 'CVHMSH2MSL-B-NOPF-ALL',
	// 'CVHMSH2MSL-B-NOPF-ALLNOTRD',
	'CVHMV0M-B-NOPF-CENT',
	'CVHMV0M-B-NOPF-CENTNOTRD',
	// 'CVHMV0M-B-SPD1-CENT',
	// 'CVHMV0M-B-SPD1-CENTNOTRD',
	'CVHMV0M-B-SPD2-CENT',
	// 'CVHMV0M-B-SPD2-CENTNOTRD',
	// 'CVHMV0M-B-spd1-CENT',
	// 'CVHMV0MMSL-B-NOPF-ALL',
	// 'CVHMV0MMSL-B-NOPF-ALLNOTRD',
    ];

    function parseDateTime(input, format) {
	format = format || 'yyyy-MM-dd HH:mm:ss'; // default format
	var parts = input.match(/(\d+)/g), 
	    i = 0, fmt = {};
	// extract date-part indexes from the format
	format.replace(/(yyyy|dd|MM|HH|mm|ss)/g, function(part) { fmt[part] = i++; });

	// Note that dates start at 0! This returns time as UTC
	return new Date(parts[fmt['yyyy']],
			parts[fmt['MM']] - 1,
			parts[fmt['dd']],
			parts[fmt['HH']],
			parts[fmt['mm']],
			parts[fmt['ss']]
		       );
    }

    
    var cleanData = function (data) {
        data.forEach(function (d, i) {
            d.index = i;
            d.run = parseInt(d.run);

            // We can also convert values, parse floats etc.
            d.fill = parseInt(d.fill);
            d['lumi_seen'] = parseFloat(d['lumi_seen']);
	    d.timeStart = parseDateTime(d.timeStart);
	    d.timeEnd = parseDateTime(d.timeEnd);
	    d.run_duration = parseFloat(d.run_duration) / 60.0 / 60.0;
	    // some runs seem to have corrupted durations
	    if (d.run_duration > 1000) {
		d.run_duration = 0;
	    }
	    triggers.forEach(function(t) {
		// In millions
		d[t] = d[t] ? parseInt(d[t]) / 1e6 : 0.0;
	    });
        });
    };


    // Create a fake group on the given dim to regroupd data across
    // several rows.
    function regroup(dim, cols) {
	var _groupAll = dim.groupAll().reduce(
            function(p, v) { // add
		cols.forEach(function(c) {
                    p[c] += v[c];
		});
		return p;
            },
            function(p, v) { // remove
		cols.forEach(function(c) {
                    p[c] -= v[c];
		});
		return p;
            },
            function() { // init
		var p = {};
		cols.forEach(function(c) {
                    p[c] = 0;
		});
		return p;
            });
	return {
            all: function() {
		// or _.pairs, anything to turn the object into an array
		return d3.map(_groupAll.value()).entries();
            }
	};
    };


    // For some reason, rowCharts don't have an axis lable. This function fixes that
    function add_x_axis_lable(chartToUpdate, displayText)
    {
	chartToUpdate.svg()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", chartToUpdate.width()/2)
            .attr("y", chartToUpdate.height()-3.5)
            .text(displayText);
    };

    return {
        createDashboard: function () {

            d3.csv('./data/trends.csv', function (data) {
                cleanData(data);
		xfitter_runs = crossfilter(data);
                var runNumber = xfitter_runs.dimension(function (d) {
                    return d.run;
                });
                var fillNumber = xfitter_runs.dimension(function (d) {
                    return d.fill;
                });
		var timeStart = xfitter_runs.dimension(function (d) {
                    return d.timeStart;
                });
		var partition = xfitter_runs.dimension(function (d) {return d.partition;});
		var period = xfitter_runs.dimension(function (d) {return d.lhcPeriod;});
		var beam = xfitter_runs.dimension(function (d) {return d.lhcState;});
		var detectors = xfitter_runs.dimension(function (d) {return d.activeDetectors;});
		// We need to have some trigger axis, but it does not
		// matter since we will not filter on it
		var trigger0 = xfitter_runs.dimension(function (d) {return d[triggers[0]];});
		
		var minDate = new Date(fillNumber.bottom(1)[0].timeStart);
                var maxDate = new Date(fillNumber.top(1)[0].timeStart);

                var timeStart_duration_group = timeStart.group()
		    .reduceSum(function(d) {
			return d.run_duration;
		    });
		var timeStart_lumi_group = timeStart.group()
		    .reduceSum(function(d) {
			return d.lumi_seen;
		    });
		// var timelineChart = dc.compositeChart("#nEventsChart");
		// timelineChart
                //     .width(1000)
                //     .x(d3.time.scale().domain([minDate, maxDate]))
                //     .dimension(timeStart)
                //     .xAxisLabel('Start of run')
                //     .yAxisLabel('Duration [h]')
		//     .brushOn(true) // Selectable region
		//     .elasticX(true)
		//     .compose([
		// 	dc.barChart(timelineChart)
		// 	    .group(timeStart_duration_group, "Run duration [h]"),
		// 	dc.lineChart(timelineChart)
		// 	    .group(timeStart_lumi_group, "Luminosity")
		// 	    .ordinalColors(["orange"])
                //             .useRightYAxis(true)
		//     ])
		//     .renderHorizontalGridLines(true);

		var timelineChart = dc.barChart("#nEventsChart");
		 timelineChart
                    .width(1000)
                    .x(d3.time.scale().domain([minDate, maxDate]))
                    .dimension(timeStart)
                    .xAxisLabel('Start of run')
                    .yAxisLabel('Duration [h]')
		    .group(timeStart_duration_group, "Run duration [h]")
		    .renderHorizontalGridLines(true);

                var beamGroup = beam.group().reduceCount();
                var beamChart = dc.rowChart('#beamChart');
		beamChart
                    .width(300)
                    .dimension(beam)
		    .elasticX(true)
                    .group(beamGroup);
		beamChart.xAxis().ticks(4);

		var triggersGroup = regroup(trigger0, triggers);
		var triggerChart = dc.rowChart("#triggerChart");
		triggerChart
                    .width(300)
                    .dimension(trigger0)
		    .group(triggersGroup)
		    .elasticX(true);
		// Set at most for ordinate lables; note: xAxis() is not chainable!
		triggerChart.xAxis().ticks(4);
		// Disable filtering when clicking on some elements of this graph
		triggerChart.filter = function() {};

                var partitionGroup = partition.group().reduceCount();
                dc.pieChart('#partitionChart')
                    .innerRadius(40)
                    .width(400)
                    .dimension(partition)
                    .group(partitionGroup)
                    .legend(dc.legend());

		// We need a `fake-group` in order to remove empty
		// bins.  A fake group is just something that returns
		// the bins we want from a `.all()` method
		function remove_empty_bins(source_group) {
		    return {
			all:function () {
			    return source_group.all().filter(function(d) {
				return d.value != 0;
			    });
			}
		    };
		}

                var periodGroup = period.group().reduceCount();
		var periodGroup_filtered = remove_empty_bins(periodGroup);
                dc.pieChart('#periodChart')
                    .innerRadius(40)
                    .width(400)
                    .dimension(period)
                    .group(periodGroup_filtered)
                    .legend(dc.legend());

                dc.renderAll();

		add_x_axis_lable(beamChart, 'Number of runs with given status');
		add_x_axis_lable(triggerChart, 'Triggers after L2A [x10^6]');
            });
        }
    };
})();


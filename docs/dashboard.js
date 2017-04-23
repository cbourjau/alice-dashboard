var xfilter_runs, detectors;


var dashboardTutorial = (function () {
    triggers = [];
    for (var i=0; i < 32; i++) {
	triggers.push("VEventBit" + i);
    }
    
    var cleanData = function (data) {
        data.forEach(function (d, i) {
            d.index = i;
            d.run = parseInt(d.run);

            // We can also convert values, parse floats etc.
            d.fill = parseInt(d.fill);
            d['lumi_seen'] = parseFloat(d['lumi_seen']);
	    // Initialize datetime with milliseconds; DAQ time is in sec
	    d.DAQ_time_start = new Date(d.DAQ_time_start * 1000);
	    d.DAQ_time_end = new Date(d.DAQ_time_end * 1000);
	    d.run_duration = d.runDuration / 60.0 / 60.0;
	    // some runs seem to have corrupted durations
	    if (d.run_duration > 1000) {
		d.run_duration = 0;
	    }
	    triggers.forEach(function(t) {
		// In millions
		d[t] = d[t] ? Math.round(parseInt(d[t]) / 1e6) : 0;
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

            d3.csv('./data/minimal.csv', function (data) {
                cleanData(data);
		xfilter_runs = crossfilter(data);
                var runNumber = xfilter_runs.dimension(function (d) {
                    return d.run;
                });
                var fillNumber = xfilter_runs.dimension(function (d) {
                    return d.fill;
                });
		var timeStart = xfilter_runs.dimension(function (d) {
                    return d.DAQ_time_start;
                });
		var timeEnd = xfilter_runs.dimension(function (d) {
                    return d.DAQ_time_end;
                });

		var partition = xfilter_runs.dimension(function (d) {return d.partition;});
		var period = xfilter_runs.dimension(function (d) {return d.LHCperiod;});
		var beam = xfilter_runs.dimension(function (d) {return d.LHCBeamMode;});
		detectors = xfilter_runs.dimension(function (d) {return d.activeDetectors;});
		// We need to have some trigger axis, but it does not
		// matter since we will not filter on it
		var trigger0 = xfilter_runs.dimension(function (d) {return d["VEventBit0"];});
		console.log(timeStart.bottom(1)[0]);
		var minDate = new Date(timeStart.bottom(1)[0].DAQ_time_start);
		var maxDate = new Date(timeEnd.top(1)[0].DAQ_time_end);

                var timeStart_duration_group = timeStart.group()
		    .reduceSum(function(d) {
			return d.run_duration;
		    });
		var timeStart_lumi_group = timeStart.group()
		    .reduceSum(function(d) {
			return d.lumi_seen;
		    });

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
		    .filter("STABLE BEAMS")
		    .elasticX(true)
                    .group(beamGroup);
		beamChart.xAxis().ticks(4);

		var triggersGroup = regroup(trigger0, triggers.slice(0, 8));
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
		    .filter("PHYSICS_1")
                    .group(partitionGroup)
                    .legend(dc.legend());

		// We need a `fake-group` in order to remove empty
		// bins.  A fake group is just something that returns
		// the bins we want from a `.all()` method
		function remove_empty_bins(source_group) {
		    function non_zero_pred(d) {
			return d.value.number != 0;
		    }
		    return {
			all:function () {
			    return source_group.all().filter(non_zero_pred);
			},
			top: function(n) {
			    return source_group
				.top(Infinity)
				.filter(non_zero_pred)
				.slice(0, n);
			}
		    };
		}

		groupedDimension = remove_empty_bins(period.group().reduce(
		    function (p, v) {
			++p.number;
			if (p.beamType != v.beamType) {
			    console.log("Encountered variation of beamType within period!");
			}
			p.beamType = v.beamType;
			if (p.beamEnergy != v.beamEnergy) {
			    console.log("Encountered variation in energy within period!");
			}
			p.beamEnergy = v.beamEnergy;
			return p;
		    },
		    function (p, v) {
			--p.number;
			return p;
		    },
		    function () {
			return {number: 0, beamType: "NA", beamEnergy: "NA"};
		    }));

		dc.dataTable("#test")
		    .dimension(groupedDimension)
		    .group(function(d) { return "<strong>" + d.key.slice(0, 5) + "</strong>"; })
		    .columns([function (d) { return d.key; },
			      function (d) { return d.value.number; },
			      function (d) { return d.value.beamType; },
			      function (d) { return d.value.beamEnergy; },
			     ])
		    .sortBy(function (d) { return d.key; })
		    .order(d3.descending);

                dc.renderAll();

		add_x_axis_lable(beamChart, 'Number of runs with given status');
		add_x_axis_lable(triggerChart, 'Triggers after L2A [x10^6]');
            });
        }
    };
})();


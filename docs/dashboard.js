var xfilter_runs, beamType;
var beam_type_filters = ['p-p', 'p-Pb', 'Pb-Pb'];

function toggle_beamtype_filter(filter_str) {
    // is the filter string alreay in the filter?
    if (beam_type_filters.indexOf(filter_str) < 0) {
	beam_type_filters.push(filter_str);
    } else {
	beam_type_filters.splice(beam_type_filters.indexOf(filter_str), 1);
    }
    beamType.filter(function (d) {return beam_type_filters.indexOf(d) >= 0;});
    dc.redrawAll();
}

function get_collumn_width(id) {
    var bb = document.querySelector(id).parentNode.getBoundingClientRect();
    width = bb.right - bb.left;
    return width;
}

var trigger_dict = {
    "VEventBit0": {
	"description": "V0A | V0C | SPD minimum bias trigger",
	"aka": ["kMB", "kINT1"]
    },
    "VEventBit1": {
	"description": "V0AND minimum bias trigger",
	"aka": ["kINT7"]
    },
    "VEventBit2": {
	"description": "Single muon trigger in pp2010-11, INT1 suite",
	"aka": ["kMUON"]
    },
    "VEventBit3": {
	"description": "High-multiplicity SPD trigger",
	"aka": ["kHighMult", "kHighMultSPD"]
    },
    "VEventBit4": {
	"description": "EMCAL trigger in pp2011, INT1 suite",
	"aka": ["kEMC1"]
    },
    "VEventBit5": {
	"description": "V0OR minimum bias trigger",
	"aka": ["kINT5", "kCINT5"]
    },
    "VEventBit6": {
	"description": "INT7 in MUON or MUFAST cluster",
	"aka": ["kINT7inMUON", "kCMUS5", "kMUSPB"]
    },
    "VEventBit7": {
	"description": "Single muon high-pt, INT7 suite",
	"aka": ["kMUSH7", "kMuonSingleHighPt7", "kMUSHPB"]
    },
    "VEventBit8": {
	"description": "Like-sign dimuon low-pt, INT7 suite",
	"aka": ["kMUL7", "kMuonLikeLowPt7", "kMuonLikePB"]
    },
    "VEventBit9": {
	"description": "Unlike-sign dimuon low-pt, INT7 suite",
	"aka": ["kMUU7", "kMuonUnlikeLowPt7", "kMuonUnlikePB"]
    },
    "VEventBit10": {
	"description": "EMCAL/DCAL L0 trigger",
	"aka": ["kEMC7", "kEMC8"]
    },
    "VEventBit11": {
	"description": "Single muon low-pt, INT7 suite",
	"aka": ["kMUS7", "kMuonSingleLowPt7"]
    },
    "VEventBit12": {
	"description": "PHOS L0 trigger in pp2011, INT1 suite",
	"aka": ["kPHI1"]
    },
    "VEventBit13": {
	"description": "PHOS trigger, INT7 suite",
	"aka": ["kPHI7", "kPHI8", "kPHOSPb"]
    },
    "VEventBit14": {
	"description": "EMCAL/DCAL L1 jet trigger",
	"aka": ["kEMCEJE"]
    },
    "VEventBit15": {
	"description": "EMCAL/DCAL L1 gamma trigger",
	"aka": ["kEMCEGA"]
    },
    "VEventBit16": {
	"description": "High-multiplicity V0 trigger",
	"aka": ["kHighMultV0", "kCentral"]
    },
    "VEventBit17": {
	"description": "Semicentral trigger in PbPb 2011",
	"aka": ["kSemiCentral"]
    },
    "VEventBit18": {
	"description": "Double gap diffractive",
	"aka": ["kDG", "kDG5"]
    },
    "VEventBit19": {
	"description": "ZDC electromagnetic dissociation",
	"aka": ["kZED"]
    },
    "VEventBit20": {
	"description": "Power interaction trigger",
	"aka": ["kSPI", "kSPI7"]
    },
    "VEventBit21": {
	"description": "0TVX trigger",
	"aka": ["kINT8"]
    },
    "VEventBit22": {
	"description": "Single muon low-pt, INT8 suite",
	"aka": ["kMuonSingleLowPt8"]
    },
    "VEventBit23": {
	"description": "Single muon high-pt, INT8 suite",
	"aka": ["kMuonSingleHighPt8"]
    },
    "VEventBit24": {
	"description": "Like-sign dimuon low-pt, INT8 suite",
	"aka": ["kMuonLikeLowPt8"]
    },
    "VEventBit25": {
	"description": "Unlike-sign dimuon low-pt, INT8 suite",
	"aka": ["kMuonUnlikeLowPt8"]
    },
    "VEventBit26": {
	"description": "Unlike-sign dimuon low-pt, no additional L0 requirement",
	"aka": ["kMuonUnlikeLowPt0"]
    },
    "VEventBit27": {
	"description": "Set when custom trigger classes are set in AliPhysicsSelection",
	"aka": ["kUserDefined"]
    },
    "VEventBit28": {
	"description": "TRD trigger",
	"aka": ["kTRD"]
    },
    "VEventBit30": {
	"description": "The fast cluster fired. This bit is set in to addition anoth",
	"aka": ["kFastOnly"]
    }
};


var dashboardTutorial = (function () {
    var trigger_bits_with_alias = Object.keys(trigger_dict);
    var trigger_bits = [];
    var trigger_aliases = trigger_bits_with_alias.map(function(bit) {
	return trigger_dict[bit]['aka'][0];
    });
    for (var i=0; i < 32; i++) {
	trigger_bits.push("VEventBit" + i);
    }
    
    var cleanData = function (data) {
        data.forEach(function (d, i) {
            d.index = i;
            d.run = parseInt(d.run);

            // We can also convert values, parse floats etc.
            d['lumi_seen'] = parseFloat(d['lumi_seen']);
	    // Initialize datetime with milliseconds; DAQ time is in sec
	    d.daq_time_start = new Date(d.daq_time_start * 1000);
	    d.daq_time_end = new Date(d.daq_time_end * 1000);
	    d.run_duration = d.run_duration / 60.0 / 60.0;
	    // some runs seem to have corrupted durations
	    if (d.run_duration > 1000) {
		d.run_duration = 0;
	    }
	    trigger_bits.forEach(function(t) {
		// Only keep trigger bits with a definition in AliVEvent.h
		if (trigger_bits_with_alias.indexOf(t) >= 0) {
		    var alias = trigger_dict[t]['aka'][0];
		    d[alias] = parseInt(d[t]);
		    // Some triggers in 11h go bananas and are in the billions
		    // See run 168458
		    if (d[alias] > 1e9) {
			d[alias] = 0;
		    }
		    // In millions
		    d[alias] = d[alias] ? Math.round(parseInt(d[alias]) / 1e6) : 0;
		}
		// Delete the non-alias entry
		delete d[t];
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
	function non_zero_pred(d) {
	    return d.value != 0;
	}

	return {
            all: function() {
		// or _.pairs, anything to turn the object into an array
		// And remove empty entries while being at it
		return d3.map(_groupAll.value()).entries().filter(non_zero_pred);
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

    return {
        createDashboard: function () {
            d3.csv('./data/trends.min.csv', function (data) {
                cleanData(data);
		xfilter_runs = crossfilter(data);
                var runNumber = xfilter_runs.dimension(function (d) {
                    return d.run;
                });
		var timeStart = xfilter_runs.dimension(function (d) {
                    return d.daq_time_start;
                });
		var timeEnd = xfilter_runs.dimension(function (d) {
                    return d.daq_time_end;
                });
		beamType = xfilter_runs.dimension(function (d) {return d.beam_type;});
		var partition = xfilter_runs.dimension(function (d) {return d.partition;});
		var period = xfilter_runs.dimension(function (d) {return d.lhc_period;});
		var beam = xfilter_runs.dimension(function (d) {return d.lhc_beam_mode;});
		detectors = xfilter_runs.dimension(function (d) {return d.active_detectors;});
		// We need to have some trigger axis, but it does not
		// matter since we will not filter on it
		var trigger0 =
		    xfilter_runs.dimension(function (d) {return d[trigger_aliases[0]];});
		var minDate = new Date(timeStart.bottom(1)[0].daq_time_start);
		var maxDate = new Date(timeEnd.top(1)[0].daq_time_end);

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
		    .width(get_collumn_width("#nEventsChart"))
                    .x(d3.time.scale().domain([minDate, maxDate]))
                    .dimension(timeStart)
                    .xAxisLabel('Start of run')
                    .yAxisLabel('Duration [h]')
		    .group(timeStart_duration_group, "Run duration [h]")
		    .renderHorizontalGridLines(true);

                var beamGroup = beam.group().reduceCount();
                var beamChart = dc.rowChart('#beamChart');
		beamChart
                    .width(get_collumn_width('#beamChart'))
                    .dimension(beam)
		    .filter("STABLE BEAMS")
		    .elasticX(true)
                    .group(beamGroup);
		beamChart.xAxis().ticks(4);

		var triggersGroup = regroup(trigger0, trigger_aliases);
		var triggerChart = dc.barChart("#triggerChart");
		triggerChart
                    .width(get_collumn_width("#triggerChart"))
		    .x(d3.scale.ordinal())
		    .xUnits(dc.units.ordinal)
                    .dimension(trigger0)
		    .group(triggersGroup)
		    .elasticY(true)
		    .xAxisLabel('Trigger alias from AliVEvent')
		    .yAxisLabel('Triggers after L2A [x10^6]')
		    .margins({ top: 10, left: 55, right: 10, bottom: 90 })
		    .renderlet(function (chart)
			       {chart
				.selectAll("g.x text")
				//.attr('dx', '-30')
				//.attr('dy', '-7')
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", ".15em")
				.attr('transform', "rotate(-45)");}); 

		// Disable filtering when clicking on some elements of this graph
		triggerChart.filter = function() {};

                var partitionGroup = partition.group().reduceCount();
                dc.pieChart('#partitionChart')
                    .innerRadius(40)
                    .width(get_collumn_width('#partitionChart'))
                    .dimension(partition)
		    .filter("PHYSICS_1")
                    .group(partitionGroup)
                    .legend(dc.legend());

		groupedDimension = remove_empty_bins(period.group().reduce(
		    function (p, v) {
			++p.number;
			p.beam_energy = v.beam_energy;
			p.beam_type = v.beam_type;
			return p;
		    },
		    function (p, v) {
			--p.number;
			p.beam_energy = v.beam_energy;
			p.beam_type = v.beam_type;
			return p;
		    },
		    function () {
			return {number: 0, beam_type: "NA", beam_energy: "NA"};
		    }));

		function create_rct_link(d) {
		    var url = "https://alimonitor.cern.ch/configuration/index.jsp?partition="
			+ d.key;
		    return "<a href=" + url + ">RCT</a>";
		};
		function create_logbook_link(d) {
		    var url = "http://aliqamodafs.web.cern.ch/aliqamodafs/data/20"
			+ d.key.slice(3, 5)
			+ "/"
			+ d.key;
		    return "<a href=" + url + ">Logbook files</a>";
		}
		function create_trending_link(d) {
		    var url = "http://aliqaevs.web.cern.ch/aliqaevs/data/20"
			+ d.key.slice(3, 5);
		    return "<a href=" + url + ">Trending files</a>";
		}
		function create_dpg_link(d) {
		    function period_pdg_approved(d) {
			const periods = ["LHC15l", "LHC15n", "LHC15o", "LHC16f", "LHC16g", "LHC16i",
					 "LHC16k", "LHC16l", "LHC16o", "LHC16q", "LHC16r", "LHC16s",
					 "LHC16t"
					];
			return periods.indexOf(d.key) >= 0;
		    }
		    const url = "https://twiki.cern.ch/twiki/bin/viewauth/ALICE/AliDPGRunLists";
		    if (period_pdg_approved(d)) {
			return '<a href ="' + url + '"><span class="glyphicon glyphicon glyphicon-ok" aria-hidden="true"></span></a>';
		    } else {
			return "";
		    }
		    
		}
		dc.dataTable("#summary-table")
		    .width(get_collumn_width("#summary-table"))
		    .dimension(groupedDimension)
		    .group(function(d) { return "<strong>" + d.key.slice(0, 5) + "</strong>"; })
		    .columns([function (d) { return d.key; },
			      function (d) { return d.value.number; },
			      function (d) { return d.value.beam_type; },
			      function (d) { return d.value.beam_energy; },
			      create_rct_link,
			      create_logbook_link,
			      create_trending_link,
			      create_dpg_link
			     ])
		    .sortBy(function (d) { return d.key; })
		    .size(100)
		    .title(function(d) {return "adsf";})
		    .order(d3.descending);

                dc.renderAll();

		add_x_axis_lable(beamChart, 'Number of runs with given status');
            });
        }
    };
})();

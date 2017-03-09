var dashboardTutorial = (function () {

    // var parseDate = function (d) {
    //     return new Date('20' + d.substring(6),
    //         d.substring(3, 5),
    //         d.substring(0, 2));
    // };

    var cleanData = function (data) {
        data.forEach(function (d, i) {
            d.index = i;
            d.run = parseInt(d.run);

            // We can also convert values, parse floats etc.
            d.fill = parseInt(d.fill);
	    d.class_l2a = parseInt(d.class_l2a);
            d['lumi_seen'] = parseFloat(d['lumi_seen']);
	    d.timeStart = new Date(d.timeStart);
	    d.timeStart = new Date(d.timeEnd);
	    d.run_duration = parseFloat(d.run_duration) / 60.0 / 60.0;
            // d['interaction rate'] = parseFloat(d['interaction rate']);
            // d['Bathrooms'] = parseInt(d['Bathrooms']);
        });
    };

    return {
        createDashboard: function () {

            d3.csv('./data/trends.csv', function (data) {

                cleanData(data);
		console.log(data);
                var runs = crossfilter(data);
                var runNumber = runs.dimension(function (d) {
                    return d.run;
                });
                var fillNumber = runs.dimension(function (d) {
                    return d.fill;
                });
		var l2a = runs.dimension(function (d) {
                    return d.class_l2a;
                });
		var timeStart = runs.dimension(function (d) {
                    return d.timeStart;
                });
		var partition = runs.dimension(function (d) {return d.partition;});
		var period = runs.dimension(function (d) {return d.lhcPeriod;});
		var beam = runs.dimension(function (d) {return d.lhcState;});

		var minDate = new Date(fillNumber.bottom(1)[0].timeStart);
                var maxDate = new Date(fillNumber.top(1)[0].timeStart);

                var timeStartGroup = timeStart.group()
		    .reduceSum(function(d) {
			return d.run_duration;
		    }); // fillNumber.group();

                dc.barChart('#nEventsChart')
                    .width(1000)
                    .x(d3.time.scale().domain([minDate, maxDate]))
                    .dimension(timeStart)
                    .group(timeStartGroup)
                    .xAxisLabel('Start of run')
                    .yAxisLabel('Duration [h]');


                // Now let's add some other charts
                // We can have row charts, pie charts, scatter plots, multi-scale plots etc.

                // I want to add a rowChart for the town the sales were made.
                // first we create the dimension we want
                // var city = houseSales.dimension(function (d) {
                //     return d.City;
                // });

                var beamGroup = beam.group();
                dc.rowChart('#beamChart')
                    .width(300)
                    .dimension(beam)
                    .group(beamGroup);

                // // I want to add a rowChart for the type of accommodation the sales were made.
                // // first we create the dimension we want
                // var type = houseSales.dimension(function (d) {
                //     return d['Accommodation Type'];
                // });

                var partitionGroup = partition.group().reduceCount();
                dc.pieChart('#partitionChart')
                    .innerRadius(40)
                    .width(400)
                    .dimension(partition)
                    .group(partitionGroup)
                    .legend(dc.legend());

                var periodGroup = period.group().reduceCount();
                dc.pieChart('#periodChart')
                    .innerRadius(40)
                    .width(400)
                    .dimension(period)
                    .group(periodGroup)
                    .legend(dc.legend());
                // // I want to add a barChart for the price.
                // var price = houseSales.dimension(function (d) {
                //     return d['Sale Price'];
                // });

                // // We get the price range from our price group (as already illustrated in our
                // // crossfilter section)
                // var minPrice = new Date(price.bottom(1)[0]['Sale Price']);
                // var maxPrice = new Date(price.top(1)[0]['Sale Price']);

                // var priceGroup = price.group();

                // dc.barChart('#priceChart')
                //     .x(d3.scale.linear().domain([minPrice, maxPrice]))
                //     .width(300)
                //     .dimension(price)
                //     .group(priceGroup)
                //     .xAxisLabel('Price (£1000s)')
                //     .yAxisLabel('Number of Sales');

                dc.renderAll();
            });
        }
    }

})();

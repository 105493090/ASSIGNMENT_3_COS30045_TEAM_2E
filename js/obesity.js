// COS30045 Data Visualisation - Obesity Page
// Team 2E: Romina Atefi, Martin Ly, Kyle McAlister
// D3 bar chart and grouped bar chart for obesity/overweight rates

function init() {

    var w = 900;
    var h = 400;
    var padding = { top: 20, right: 30, bottom: 100, left: 60 };

    var currentYear = "2022";
    var currentMeasure = "Share of population who are obese";

    d3.csv("data/data.csv").then(function(data) {

        data.forEach(function(d) { d.value = +d.value; });

        var weightData = data.filter(function(d) {
            return (d.measure === "Share of population who are obese" ||
                    d.measure === "Share of population who are overweight")
                    && d.age === "Total";
        });

        var years = [...new Set(weightData.map(function(d) { return d.year; }))].sort();

        // Year buttons
        var yearDiv = d3.select("#yearButtons");
        years.forEach(function(y) {
            yearDiv.append("button")
                .text(y)
                .classed("active", y === currentYear)
                .on("click", function() {
                    currentYear = y;
                    d3.selectAll("#yearButtons button").classed("active", false);
                    d3.select(this).classed("active", true);
                    updateBarChart();
                    updateGroupedChart();
                });
        });

        // Measure buttons
        d3.selectAll("#measureButtons button").on("click", function() {
            var label = d3.select(this).text();
            currentMeasure = label === "Obese"
                ? "Share of population who are obese"
                : "Share of population who are overweight";
            d3.selectAll("#measureButtons button").classed("active", false);
            d3.select(this).classed("active", true);
            updateBarChart();
            updateGroupedChart();
        });

        // ===== BAR CHART (Total) =====
        var svgBar = d3.select("#barChart")
            .append("svg").attr("width", w).attr("height", h);

        var tooltip = d3.select("body").append("div").attr("class", "tooltip");

        var xScale = d3.scaleBand().range([padding.left, w - padding.right]).padding(0.2);
        var yScale = d3.scaleLinear().range([h - padding.bottom, padding.top]);

        var xAxisGroup = svgBar.append("g").attr("class", "axis")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")");
        var yAxisGroup = svgBar.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svgBar.append("text").attr("transform", "rotate(-90)")
            .attr("x", -(h / 2)).attr("y", 15)
            .attr("text-anchor", "middle").attr("font-size", "12px").attr("fill", "#555")
            .text("% of population");

        var barCaption = d3.select("#barCaption");

        function updateBarChart() {
            var filtered = weightData.filter(function(d) {
                return d.year === currentYear && d.measure === currentMeasure && d.sex === "Total";
            });
            filtered.sort(function(a, b) { return b.value - a.value; });

            xScale.domain(filtered.map(function(d) { return d.country; }));
            yScale.domain([0, d3.max(filtered, function(d) { return d.value; }) * 1.1]);

            xAxisGroup.transition().duration(500).call(d3.axisBottom(xScale))
                .selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
            yAxisGroup.transition().duration(500).call(d3.axisLeft(yScale).ticks(6));

            var bars = svgBar.selectAll("rect").data(filtered, function(d) { return d.country; });
            bars.exit().transition().duration(300).attr("height", 0).attr("y", h - padding.bottom).remove();

            bars.enter().append("rect")
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", h - padding.bottom)
                .attr("width", xScale.bandwidth()).attr("height", 0)
                .attr("fill", "#d4763a")
                .on("mouseover", function(event, d) {
                    tooltip.style("opacity", 1)
                        .html("<strong>" + d.country + "</strong><br>" + d.value + "%")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");
                    d3.select(this).attr("fill", "#8b3a0f");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", "#d4763a");
                })
                .merge(bars).transition().duration(500)
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", function(d) { return yScale(d.value); })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { return h - padding.bottom - yScale(d.value); });

            var label = currentMeasure.includes("obese") ? "obese" : "overweight";
            barCaption.text("Fig 1. Share of population who are " + label + " (Total, " + currentYear + "). Source: OECD Health Statistics.");
        }

        // ===== GROUPED BAR CHART (Male vs Female) =====
        var hGrouped = 400;
        var svgGrouped = d3.select("#groupedChart")
            .append("svg").attr("width", w).attr("height", hGrouped);

        var xGrouped = d3.scaleBand().range([padding.left, w - padding.right]).padding(0.15);
        var xSub = d3.scaleBand().padding(0.05);
        var yGrouped = d3.scaleLinear().range([hGrouped - padding.bottom, padding.top]);

        var sexColor = d3.scaleOrdinal()
            .domain(["Male", "Female"])
            .range(["#3a7ca5", "#d4763a"]);

        var xGroupedAxis = svgGrouped.append("g").attr("class", "axis")
            .attr("transform", "translate(0," + (hGrouped - padding.bottom) + ")");
        var yGroupedAxis = svgGrouped.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svgGrouped.append("text").attr("transform", "rotate(-90)")
            .attr("x", -(hGrouped / 2)).attr("y", 15)
            .attr("text-anchor", "middle").attr("font-size", "12px").attr("fill", "#555")
            .text("% of population");

        // Legend
        var legend = svgGrouped.append("g").attr("transform", "translate(" + (w - 150) + "," + 30 + ")");
        ["Male", "Female"].forEach(function(s, i) {
            legend.append("rect").attr("x", 0).attr("y", i * 20).attr("width", 12).attr("height", 12).attr("fill", sexColor(s));
            legend.append("text").attr("x", 18).attr("y", i * 20 + 11).attr("font-size", "12px").text(s);
        });

        var groupedCaption = d3.select("#groupedCaption");

        function updateGroupedChart() {
            var maleData = weightData.filter(function(d) {
                return d.year === currentYear && d.measure === currentMeasure && d.sex === "Male";
            });
            var femaleData = weightData.filter(function(d) {
                return d.year === currentYear && d.measure === currentMeasure && d.sex === "Female";
            });

            var countries = [...new Set(maleData.map(function(d) { return d.country; }))];
            // Sort by male value descending
            countries.sort(function(a, b) {
                var aVal = maleData.find(function(d) { return d.country === a; });
                var bVal = maleData.find(function(d) { return d.country === b; });
                return (bVal ? bVal.value : 0) - (aVal ? aVal.value : 0);
            });

            xGrouped.domain(countries);
            xSub.domain(["Male", "Female"]).range([0, xGrouped.bandwidth()]);

            var allVals = maleData.concat(femaleData).map(function(d) { return d.value; });
            yGrouped.domain([0, d3.max(allVals) * 1.1]);

            xGroupedAxis.transition().duration(500).call(d3.axisBottom(xGrouped))
                .selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
            yGroupedAxis.transition().duration(500).call(d3.axisLeft(yGrouped).ticks(6));

            // Clear old bars
            svgGrouped.selectAll(".grouped-bar").remove();

            countries.forEach(function(country) {
                var maleVal = maleData.find(function(d) { return d.country === country; });
                var femaleVal = femaleData.find(function(d) { return d.country === country; });

                if (maleVal) {
                    svgGrouped.append("rect").attr("class", "grouped-bar")
                        .attr("x", xGrouped(country) + xSub("Male"))
                        .attr("y", yGrouped(maleVal.value))
                        .attr("width", xSub.bandwidth())
                        .attr("height", hGrouped - padding.bottom - yGrouped(maleVal.value))
                        .attr("fill", sexColor("Male"));
                }
                if (femaleVal) {
                    svgGrouped.append("rect").attr("class", "grouped-bar")
                        .attr("x", xGrouped(country) + xSub("Female"))
                        .attr("y", yGrouped(femaleVal.value))
                        .attr("width", xSub.bandwidth())
                        .attr("height", hGrouped - padding.bottom - yGrouped(femaleVal.value))
                        .attr("fill", sexColor("Female"));
                }
            });

            var label = currentMeasure.includes("obese") ? "obese" : "overweight";
            groupedCaption.text("Fig 2. Male vs Female " + label + " rates by country (" + currentYear + "). Source: OECD Health Statistics.");
        }

        updateBarChart();
        updateGroupedChart();
    });
}

window.onload = init;

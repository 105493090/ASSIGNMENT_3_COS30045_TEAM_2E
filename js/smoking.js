function init() {

    var w = 900;
    var h = 450;
    var padding = { top: 20, right: 20, bottom: 100, left: 60 };

    var currentYear = "2022";
    var currentSex = "Total";

    // Load data
    d3.csv("data/data.csv").then(function(data) {

        // Convert value to number
        data.forEach(function(d) {
            d.value = +d.value;
        });

        // Filter to daily smokers only
        var smokingData = data.filter(function(d) {
            return d.measure === "Share of population who are daily smokers";
        });

        // Get available years
        var years = [...new Set(smokingData.map(function(d) { return d.year; }))].sort();

        // Build year buttons
        var yearDiv = d3.select("#yearButtons");
        years.forEach(function(y) {
            yearDiv.append("button")
                .text(y)
                .classed("active", y === currentYear)
                .on("click", function() {
                    currentYear = y;
                    d3.selectAll("#yearButtons button").classed("active", false);
                    d3.select(this).classed("active", true);
                    updateChart();
                });
        });

        // Sex buttons
        d3.selectAll("#sexButtons button").on("click", function() {
            currentSex = d3.select(this).text();
            d3.selectAll("#sexButtons button").classed("active", false);
            d3.select(this).classed("active", true);
            updateChart();
        });

        // Create SVG
        var svg = d3.select("#chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // Tooltip
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");

        // Scales
        var xScale = d3.scaleBand()
            .range([padding.left, w - padding.right])
            .padding(0.2);

        var yScale = d3.scaleLinear()
            .range([h - padding.bottom, padding.top]);

        // Axes groups
        var xAxisGroup = svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")");

        var yAxisGroup = svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        // Y axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(h / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#555")
            .text("% of population");

        // Caption
        var caption = d3.select("#caption");

        function updateChart() {

            // Filter data for current selections
            var filtered = smokingData.filter(function(d) {
                return d.year === currentYear && d.sex === currentSex && d.age === "15 years or over";
            });

            // Sort by value descending
            filtered.sort(function(a, b) {
                return b.value - a.value;
            });

            // Update scales
            xScale.domain(filtered.map(function(d) { return d.country; }));
            yScale.domain([0, d3.max(filtered, function(d) { return d.value; }) * 1.1]);

            // Update axes
            xAxisGroup.transition().duration(500)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-40)")
                .style("text-anchor", "end");

            yAxisGroup.transition().duration(500)
                .call(d3.axisLeft(yScale).ticks(6));

            // Binddata to bars
            var bars = svg.selectAll("rect").data(filtered, function(d) { return d.country; });

            // Remove old bars
            bars.exit().transition().duration(300)
                .attr("height", 0)
                .attr("y", h - padding.bottom)
                .remove();

            // Add new bars
            bars.enter()
                .append("rect")
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", h - padding.bottom)
                .attr("width", xScale.bandwidth())
                .attr("height", 0)
                .attr("fill", "#3a7ca5")
                .on("mouseover", function(event, d) {
                    tooltip.style("opacity", 1)
                        .html(d.country + ": " + d.value + "%")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");
                    d3.select(this).attr("fill", "#1b3a4b");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", "#3a7ca5");
                })
                .merge(bars)
                .transition().duration(500)
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", function(d) { return yScale(d.value); })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { return h - padding.bottom - yScale(d.value); });

            // Update caption
            caption.text("Fig 1. Share of population who are daily smokers (" + currentSex + ", " + currentYear + "). Source: OECD Health Statistics.");
        }

        updateChart();
    });
}

window.onload = init;

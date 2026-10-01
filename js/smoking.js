// COS30045 Data Visualisation - Smoking Page
// Team 2E: Romina Atefi, Martin Ly, Kyle McAlister
// D3 bar chart and line chart for daily smoking rates

function init() {

    var w = 900;
    var h = 400;
    var padding = { top: 20, right: 30, bottom: 100, left: 60 };

    var currentYear = "2022";
    var currentSex = "Total";

    // Load data from CSV
    d3.csv("data/data.csv").then(function(data) {

        // Convert value to number
        data.forEach(function(d) {
            d.value = +d.value;
        });

        // Filter to daily smokers, age 15+
        var smokingData = data.filter(function(d) {
            return d.measure === "Share of population who are daily smokers"
                && d.age === "15 years or over";
        });

        // Get available years for buttons
        var years = [...new Set(smokingData.map(function(d) { return d.year; }))].sort();

        // ===== BAR CHART SECTION =====

        // Build year filter buttons
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
                });
        });

        // Sex filter buttons
        d3.selectAll("#sexButtons button").on("click", function() {
            currentSex = d3.select(this).text();
            d3.selectAll("#sexButtons button").classed("active", false);
            d3.select(this).classed("active", true);
            updateBarChart();
            updateLineChart();
        });

        // Create bar chart SVG
        var svgBar = d3.select("#barChart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // Tooltip for details on demand 
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");

        // Scales - using scaleBand for categorical x-axis
        var xScale = d3.scaleBand()
            .range([padding.left, w - padding.right])
            .padding(0.2);

        var yScale = d3.scaleLinear()
            .range([h - padding.bottom, padding.top]);

        // Axis groups
        var xAxisGroup = svgBar.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")");

        var yAxisGroup = svgBar.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        // Y-axis label
        svgBar.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(h / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#555")
            .text("% of population");

        var barCaption = d3.select("#barCaption");

        // Update bar chart function - called when filters change
        function updateBarChart() {

            var filtered = smokingData.filter(function(d) {
                return d.year === currentYear && d.sex === currentSex;
            });

            // Sort descending by value for better readability
            filtered.sort(function(a, b) { return b.value - a.value; });

            // Update scales with new data
            xScale.domain(filtered.map(function(d) { return d.country; }));
            yScale.domain([0, d3.max(filtered, function(d) { return d.value; }) * 1.1]);

            // Animated axis transitions
            xAxisGroup.transition().duration(500)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-40)")
                .style("text-anchor", "end");

            yAxisGroup.transition().duration(500)
                .call(d3.axisLeft(yScale).ticks(6));

            // Data join pattern: enter, update, exit
            var bars = svgBar.selectAll("rect").data(filtered, function(d) { return d.country; });

            bars.exit().transition().duration(300)
                .attr("height", 0).attr("y", h - padding.bottom).remove();

            bars.enter()
                .append("rect")
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", h - padding.bottom)
                .attr("width", xScale.bandwidth())
                .attr("height", 0)
                .attr("fill", "#3a7ca5")
                .on("mouseover", function(event, d) {
                    // Details on demand
                    tooltip.style("opacity", 1)
                        .html("<strong>" + d.country + "</strong><br>" + d.value + "%")
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

            barCaption.text("Fig 1. Daily smoking rates by country (" + currentSex + ", " + currentYear + "). Source: OECD Health Statistics.");
        }

        // ===== LINE CHART SECTION =====
        // Shows trends over time - a different idiom to the bar chart

        var hLine = 350;
        var svgLine = d3.select("#lineChart")
            .append("svg")
            .attr("width", w)
            .attr("height", hLine);

        var xTimescale = d3.scaleLinear()
            .range([padding.left, w - padding.right]);

        var yLineScale = d3.scaleLinear()
            .range([hLine - padding.bottom, padding.top]);

        // Using ColorBrewer-inspired palette for colour blind friendliness
        var colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        var xLineAxis = svgLine.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (hLine - padding.bottom) + ")");

        var yLineAxis = svgLine.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svgLine.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(hLine / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#555")
            .text("% of population");

        var lineCaption = d3.select("#lineCaption");

        // D3 line generator
        var line = d3.line()
            .x(function(d) { return xTimescale(+d.year); })
            .y(function(d) { return yLineScale(d.value); });

        function updateLineChart() {

            var lineData = smokingData.filter(function(d) {
                return d.sex === currentSex;
            });

            // Group data by country using d3.groups
            var grouped = d3.groups(lineData, function(d) { return d.country; });

            // Sort each country's data by year
            grouped.forEach(function(g) {
                g[1].sort(function(a, b) { return +a.year - +b.year; });
            });

            var allYears = lineData.map(function(d) { return +d.year; });
            xTimescale.domain([d3.min(allYears), d3.max(allYears)]);
            yLineScale.domain([0, d3.max(lineData, function(d) { return d.value; }) * 1.1]);

            xLineAxis.transition().duration(500)
                .call(d3.axisBottom(xTimescale).tickFormat(d3.format("d")).ticks(years.length));

            yLineAxis.transition().duration(500)
                .call(d3.axisLeft(yLineScale).ticks(6));

            // Remove old lines and labels
            svgLine.selectAll(".country-line").remove();
            svgLine.selectAll(".country-label").remove();

            // Draw a line for each country
            grouped.forEach(function(g) {
                var countryName = g[0];
                var countryData = g[1];

                svgLine.append("path")
                    .datum(countryData)
                    .attr("class", "country-line")
                    .attr("fill", "none")
                    .attr("stroke", colorScale(countryName))
                    .attr("stroke-width", 2)
                    .attr("d", line)
                    .attr("opacity", 0.7);

                // Label at the end of each line
                var lastPoint = countryData[countryData.length - 1];
                if (lastPoint) {
                    svgLine.append("text")
                        .attr("class", "country-label")
                        .attr("x", xTimescale(+lastPoint.year) + 5)
                        .attr("y", yLineScale(lastPoint.value) + 4)
                        .attr("font-size", "9px")
                        .attr("fill", colorScale(countryName))
                        .text(countryName);
                }
            });

            lineCaption.text("Fig 2. Daily smoking rate trends over time (" + currentSex + ", " + years[0] + "–" + years[years.length-1] + "). Source: OECD Health Statistics.");
        }

        // Initial render
        updateBarChart();
        updateLineChart();
    });
}

window.onload = init;

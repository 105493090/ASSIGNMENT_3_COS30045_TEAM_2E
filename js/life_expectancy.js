// COS30045 Data Visualisation - Life Expectancy Page
// Team 2E: Romina Atefi, Martin Ly, Kyle McAlister
// Bar chart + line chart, scatter plot linking both datasets

function init() {

    var w = 900;
    var h = 400;
    var padding = { top: 20, right: 30, bottom: 100, left: 60 };

    var currentYear = "2022";
    var currentSex = "Total";

    // Load BOTH datasets to combine them
    Promise.all([
        d3.csv("data/health_status.csv"),
        d3.csv("data/data.csv")
    ]).then(function(datasets) {

        var healthData = datasets[0];
        var riskData = datasets[1];

        healthData.forEach(function(d) { d.value = +d.value; });
        riskData.forEach(function(d) { d.value = +d.value; });

        // Life expectancy at birth
        var leData = healthData.filter(function(d) {
            return d.measure === "Life expectancy" && d.age === "0 years";
        });

        // Smoking data for scatter plot
        var smokingData = riskData.filter(function(d) {
            return d.measure === "Share of population who are daily smokers"
                && d.age === "15 years or over";
        });

        var years = [...new Set(leData.map(function(d) { return d.year; }))].sort();

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
                    updateLineChart();
                    updateScatter();
                });
        });

        // Sex buttons
        d3.selectAll("#sexButtons button").on("click", function() {
            currentSex = d3.select(this).text();
            d3.selectAll("#sexButtons button").classed("active", false);
            d3.select(this).classed("active", true);
            updateBarChart();
            updateLineChart();
            updateScatter();
        });

        var tooltip = d3.select("body").append("div").attr("class", "tooltip");

        // ===== BAR CHART =====
        var svgBar = d3.select("#barChart").append("svg").attr("width", w).attr("height", h);
        var xScale = d3.scaleBand().range([padding.left, w - padding.right]).padding(0.2);
        var yScale = d3.scaleLinear().range([h - padding.bottom, padding.top]);
        var xAxisGroup = svgBar.append("g").attr("class", "axis")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")");
        var yAxisGroup = svgBar.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svgBar.append("text").attr("transform", "rotate(-90)")
            .attr("x", -(h / 2)).attr("y", 15).attr("text-anchor", "middle")
            .attr("font-size", "12px").attr("fill", "#555").text("Years");

        var barCaption = d3.select("#barCaption");

        function updateBarChart() {
            var filtered = leData.filter(function(d) {
                return d.year === currentYear && d.sex === currentSex;
            });
            filtered.sort(function(a, b) { return b.value - a.value; });

            xScale.domain(filtered.map(function(d) { return d.country; }));
            var minVal = d3.min(filtered, function(d) { return d.value; });
            var maxVal = d3.max(filtered, function(d) { return d.value; });
            yScale.domain([Math.floor(minVal - 2), Math.ceil(maxVal + 1)]);

            xAxisGroup.transition().duration(500).call(d3.axisBottom(xScale))
                .selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
            yAxisGroup.transition().duration(500).call(d3.axisLeft(yScale).ticks(8));

            var bars = svgBar.selectAll("rect").data(filtered, function(d) { return d.country; });
            bars.exit().transition().duration(300).attr("height", 0).attr("y", h - padding.bottom).remove();

            bars.enter().append("rect")
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", h - padding.bottom).attr("width", xScale.bandwidth()).attr("height", 0)
                .attr("fill", "#2a9d8f")
                .on("mouseover", function(event, d) {
                    tooltip.style("opacity", 1)
                        .html("<strong>" + d.country + "</strong><br>" + d.value + " years")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");
                    d3.select(this).attr("fill", "#1a6b60");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", "#2a9d8f");
                })
                .merge(bars).transition().duration(500)
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", function(d) { return yScale(d.value); })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { return h - padding.bottom - yScale(d.value); });

            barCaption.text("Fig 1. Life expectancy at birth (" + currentSex + ", " + currentYear + "). Source: OECD Health Statistics.");
        }

        // ===== LINE CHART =====
        var hLine = 350;
        var svgLine = d3.select("#lineChart").append("svg").attr("width", w).attr("height", hLine);
        var colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        var xTimeScale = d3.scaleLinear().range([padding.left, w - padding.right]);
        var yLineScale = d3.scaleLinear().range([hLine - padding.bottom, padding.top]);

        var xLineAxis = svgLine.append("g").attr("class", "axis")
            .attr("transform", "translate(0," + (hLine - padding.bottom) + ")");
        var yLineAxis = svgLine.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svgLine.append("text").attr("transform", "rotate(-90)")
            .attr("x", -(hLine / 2)).attr("y", 15).attr("text-anchor", "middle")
            .attr("font-size", "12px").attr("fill", "#555").text("Years");

        var line = d3.line()
            .x(function(d) { return xTimeScale(+d.year); })
            .y(function(d) { return yLineScale(d.value); });

        var lineCaption = d3.select("#lineCaption");

        function updateLineChart() {
            var lineData = leData.filter(function(d) { return d.sex === currentSex; });
            var grouped = d3.groups(lineData, function(d) { return d.country; });
            grouped.forEach(function(g) { g[1].sort(function(a, b) { return +a.year - +b.year; }); });

            var allYears = lineData.map(function(d) { return +d.year; });
            xTimeScale.domain([d3.min(allYears), d3.max(allYears)]);
            yLineScale.domain([d3.min(lineData, function(d) { return d.value; }) - 2,
                               d3.max(lineData, function(d) { return d.value; }) + 1]);

            xLineAxis.transition().duration(500)
                .call(d3.axisBottom(xTimeScale).tickFormat(d3.format("d")).ticks(years.length));
            yLineAxis.transition().duration(500).call(d3.axisLeft(yLineScale).ticks(6));

            svgLine.selectAll(".country-line").remove();
            svgLine.selectAll(".country-label").remove();

            grouped.forEach(function(g) {
                svgLine.append("path").datum(g[1]).attr("class", "country-line")
                    .attr("fill", "none").attr("stroke", colorScale(g[0]))
                    .attr("stroke-width", 2).attr("d", line).attr("opacity", 0.7);

                var last = g[1][g[1].length - 1];
                if (last) {
                    svgLine.append("text").attr("class", "country-label")
                        .attr("x", xTimeScale(+last.year) + 5)
                        .attr("y", yLineScale(last.value) + 4)
                        .attr("font-size", "9px").attr("fill", colorScale(g[0])).text(g[0]);
                }
            });

            lineCaption.text("Fig 2. Life expectancy trends over time (" + currentSex + "). Source: OECD Health Statistics.");
        }

        // ===== SCATTER PLOT: Smoking vs Life Expectancy (combining both datasets) =====
        var hScatter = 400;
        var svgScatter = d3.select("#scatterChart").append("svg").attr("width", w).attr("height", hScatter);

        var xScatter = d3.scaleLinear().range([padding.left, w - padding.right]);
        var yScatter = d3.scaleLinear().range([hScatter - padding.bottom, padding.top]);

        var xScatterAxis = svgScatter.append("g").attr("class", "axis")
            .attr("transform", "translate(0," + (hScatter - padding.bottom) + ")");
        var yScatterAxis = svgScatter.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svgScatter.append("text")
            .attr("x", w / 2).attr("y", hScatter - 10)
            .attr("text-anchor", "middle").attr("font-size", "12px").attr("fill", "#555")
            .text("Daily smoking rate (%)");

        svgScatter.append("text").attr("transform", "rotate(-90)")
            .attr("x", -(hScatter / 2)).attr("y", 15).attr("text-anchor", "middle")
            .attr("font-size", "12px").attr("fill", "#555")
            .text("Life expectancy (years)");

        var scatterCaption = d3.select("#scatterCaption");

        function updateScatter() {
            // Merge smoking and life expectancy by country, year, sex
            var leFiltered = leData.filter(function(d) {
                return d.year === currentYear && d.sex === currentSex;
            });
            var smokingFiltered = smokingData.filter(function(d) {
                return d.year === currentYear && d.sex === currentSex;
            });

            var merged = [];
            leFiltered.forEach(function(le) {
                var smoking = smokingFiltered.find(function(s) { return s.country === le.country; });
                if (smoking) {
                    merged.push({
                        country: le.country,
                        lifeExp: le.value,
                        smokingRate: smoking.value
                    });
                }
            });

            xScatter.domain([0, d3.max(merged, function(d) { return d.smokingRate; }) * 1.15]);
            yScatter.domain([d3.min(merged, function(d) { return d.lifeExp; }) - 2,
                             d3.max(merged, function(d) { return d.lifeExp; }) + 1]);

            xScatterAxis.transition().duration(500).call(d3.axisBottom(xScatter).ticks(8));
            yScatterAxis.transition().duration(500).call(d3.axisLeft(yScatter).ticks(8));

            // Remove old dots and labels
            svgScatter.selectAll("circle").remove();
            svgScatter.selectAll(".scatter-label").remove();

            svgScatter.selectAll("circle")
                .data(merged)
                .enter()
                .append("circle")
                .attr("cx", function(d) { return xScatter(d.smokingRate); })
                .attr("cy", function(d) { return yScatter(d.lifeExp); })
                .attr("r", 6)
                .attr("fill", "#e76f51")
                .attr("opacity", 0.8)
                .on("mouseover", function(event, d) {
                    tooltip.style("opacity", 1)
                        .html("<strong>" + d.country + "</strong><br>Smoking: " + d.smokingRate + "%<br>Life exp: " + d.lifeExp + " years")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");
                    d3.select(this).attr("r", 9).attr("fill", "#c0392b");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("r", 6).attr("fill", "#e76f51");
                });

            // Country labels next to dots
            svgScatter.selectAll(".scatter-label")
                .data(merged)
                .enter()
                .append("text")
                .attr("class", "scatter-label")
                .attr("x", function(d) { return xScatter(d.smokingRate) + 9; })
                .attr("y", function(d) { return yScatter(d.lifeExp) + 4; })
                .attr("font-size", "9px")
                .attr("fill", "#555")
                .text(function(d) { return d.country; });

            scatterCaption.text("Fig 3. Smoking rate vs life expectancy (" + currentSex + ", " + currentYear + "). Sources: OECD Risk Factors & Health Status.");
        }

        updateBarChart();
        updateLineChart();
        updateScatter();
    });
}

window.onload = init;

function init() {

    var w = 900;
    var h = 450;
    var padding = { top: 20, right: 20, bottom: 100, left: 60 };

    var currentYear = "2022";
    var currentSex = "Total";

    d3.csv("data/health_status.csv").then(function(data) {

        data.forEach(function(d) {
            d.value = +d.value;
        });

        // Filter to life expectancy at birth (0 years)
        var leData = data.filter(function(d) {
            return d.measure === "Life expectancy" && d.age === "0 years";
        });

        // Get available years
        var years = [...new Set(leData.map(function(d) { return d.year; }))].sort();

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

        var svg = d3.select("#chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");

        var xScale = d3.scaleBand()
            .range([padding.left, w - padding.right])
            .padding(0.2);

        var yScale = d3.scaleLinear()
            .range([h - padding.bottom, padding.top]);

        var xAxisGroup = svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")");

        var yAxisGroup = svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + padding.left + ",0)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(h / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#555")
            .text("Years");

        var caption = d3.select("#caption");

        function updateChart() {

            var filtered = leData.filter(function(d) {
                return d.year === currentYear && d.sex === currentSex;
            });

            filtered.sort(function(a, b) {
                return b.value - a.value;
            });

            xScale.domain(filtered.map(function(d) { return d.country; }));
            // Start y axis at a reasonable minimum instead of 0
            var minVal = d3.min(filtered, function(d) { return d.value; });
            var maxVal = d3.max(filtered, function(d) { return d.value; });
            yScale.domain([Math.floor(minVal - 2), Math.ceil(maxVal + 1)]);

            xAxisGroup.transition().duration(500)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-40)")
                .style("text-anchor", "end");

            yAxisGroup.transition().duration(500)
                .call(d3.axisLeft(yScale).ticks(8));

            var bars = svg.selectAll("rect").data(filtered, function(d) { return d.country; });

            bars.exit().transition().duration(300)
                .attr("height", 0)
                .attr("y", h - padding.bottom)
                .remove();

            bars.enter()
                .append("rect")
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", h - padding.bottom)
                .attr("width", xScale.bandwidth())
                .attr("height", 0)
                .attr("fill", "#2a9d8f")
                .on("mouseover", function(event, d) {
                    tooltip.style("opacity", 1)
                        .html(d.country + ": " + d.value + " years")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");
                    d3.select(this).attr("fill", "#1a6b60");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", "#2a9d8f");
                })
                .merge(bars)
                .transition().duration(500)
                .attr("x", function(d) { return xScale(d.country); })
                .attr("y", function(d) { return yScale(d.value); })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { return h - padding.bottom - yScale(d.value); });

            caption.text("Fig 1. Life expectancy at birth in years (" + currentSex + ", " + currentYear + "). Source: OECD Health Statistics.");
        }

        updateChart();
    });
}

window.onload = init;

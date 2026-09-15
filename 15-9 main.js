console.log("D3 visualisation project loaded.");

function init() {

    d3.csv("OECD_Data_Filtered.csv")
        .then(function(data) {

            data.forEach(function(d) {
                d.OBS_VALUE = +d.OBS_VALUE;
            });

            console.log(data);

            barChart(data);
        })
        .catch(function(error) {
            console.error(error);
        });
}

function barChart(data) {

    var w = 1200;
    var h = 500;
    var barPadding = 2;

    var maxValue = d3.max(data, function(d) {
        return d.OBS_VALUE;
    });

    var svg = d3.select("#visualisation")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return i * (w / data.length);
        })
        .attr("y", function(d) {
            return h - ((d.OBS_VALUE / maxValue) * h);
        })
        .attr("width", function(d) {
            return (w / data.length) - barPadding;
        })
        .attr("height", function(d) {
            return (d.OBS_VALUE / maxValue) * h;
        })
        .attr("fill", "steelblue");

    svg.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .text(function(d) {
            return d.REF_AREA;
        })
        .attr("x", function(d, i) {
            return i * (w / data.length) + 10;
        })
        .attr("y", h - 5)
        .attr("font-size", "10px")
        .attr("fill", "black");
}

window.onload = init;

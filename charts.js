async function drawlineChat() {
    const data = await d3.csv("fuelprice.csv");

    const yAccessor = d => +d.Diesel;
    const petrolAccessor = d => +d.Petrol;
    const dataParse = d3.timeParse("%m/%d/%Y");
    const xAccessor = d => dataParse(d.date);

    // Function to set dimensions dynamically
    function setDimensions() {
        const container = d3.select("#wrapper").node();
        const width = container.getBoundingClientRect().width || 800; // Default to 800 if not found

        return {
            width: width,
            height: 500,
            margin: {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            },
            boundedwidth: width - 100, // Adjust for margins
            boundedheight: 500 - 100 // Adjust for margins
        };
    }

    let dimensions = setDimensions();

    // Clear previous SVG (if any)
    d3.select("#wrapper").selectAll("svg").remove();

    const wrapper = d3.select("#wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    const bounds = wrapper.append("g")
        .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(yAccessor(d), petrolAccessor(d)))])
        .range([dimensions.boundedheight, 0]);

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, xAccessor))
        .range([0, dimensions.boundedwidth]);

    const dieselLineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(yAccessor(d)));

    const petrolLineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(petrolAccessor(d)));

    // Clip-path to constrain the drawing within bounds
    bounds.append("clipPath")
        .attr("id", "clip-path")
        .append("rect")
        .attr("width", dimensions.boundedwidth)
        .attr("height", dimensions.boundedheight);

    // Draw Diesel Line
    const dieselPath = bounds.append("path")
        .datum(data)
        .attr("class", "diesel-line")
        .attr("d", dieselLineGenerator)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("clip-path", "url(#clip-path)");

    const totalLengthDiesel = dieselPath.node().getTotalLength();

    dieselPath
        .attr("stroke-dasharray", `${totalLengthDiesel} ${totalLengthDiesel}`)
        .attr("stroke-dashoffset", totalLengthDiesel)
        .transition()
        .duration(20000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Draw Petrol Line
    const petrolPath = bounds.append("path")
        .datum(data)
        .attr("class", "petrol-line")
        .attr("d", petrolLineGenerator)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("clip-path", "url(#clip-path)");

    const totalLengthPetrol = petrolPath.node().getTotalLength();

    petrolPath
        .attr("stroke-dasharray", `${totalLengthPetrol} ${totalLengthPetrol}`)
        .attr("stroke-dashoffset", totalLengthPetrol)
        .transition()
        .delay(500) // Add a delay for a staggered effect
        .duration(20000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    const dateFormatter = d3.timeFormat("%B %Y"); // Month Year format

    const tooltip = d3.select("#tooltip");

    bounds.selectAll(".interaction-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "interaction-circle")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessor(d)))
        .attr("r", 5)
        .attr("fill", "transparent")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "blue")
            tooltip
                .style("display", "block")
                .html(`<strong>Date:</strong> ${dateFormatter(xAccessor(d))}<br><strong>Diesel:</strong> #${yAccessor(d)}`)
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "transparent");
            tooltip.style("display", "none")
        });

    bounds.selectAll(".petrol-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "petrol-circle")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(petrolAccessor(d)))
        .attr("r", 5)
        .attr("fill", "transparent")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "red")
            tooltip
                .style("display", "block")
                .html(`<strong>Date:</strong>  ${dateFormatter(xAccessor(d))}<br><strong>Petrol:</strong> #${petrolAccessor(d)}`)
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "transparent");
            tooltip.style("display", "none")
        });

    // Axes
    const yAxisGenerator = d3.axisLeft(yScale).ticks(10);
    const xAxisGenerator = d3.axisBottom(xScale).ticks(10);

    bounds.append("g")
        .call(yAxisGenerator);

    bounds.append("g")
        .call(xAxisGenerator)
        .attr("transform", `translate(0, ${dimensions.boundedheight})`);

    // Labels
    wrapper.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Date");

    wrapper.append("text")
        .attr("x", -dimensions.height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("transform", "rotate(-90)")
        .text("Fuel Price");

    // Legend
    const legend = wrapper.append("g")
        .attr("transform", `translate(${dimensions.width - 150}, ${dimensions.margin.top})`);

    legend.append("rect").attr("x", -50).attr("y", 0).attr("width", 10).attr("height", 10).attr("fill", "blue");
    legend.append("text").attr("x", -35).attr("y", 10).attr("font-size", "10px").text("Diesel");

    legend.append("rect").attr("x", -50).attr("y", 20).attr("width", 10).attr("height", 10).attr("fill", "red");
    legend.append("text").attr("x", -35).attr("y", 30).attr("font-size", "10px").text("Petrol");
}

// Initial draw
drawlineChat();

// Redraw on window resize
window.addEventListener("resize", drawlineChat);
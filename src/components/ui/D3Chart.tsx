import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { ChartPoint, ChartType, interpolateColors } from "../../types";

interface Props {
  type: ChartType;
  data: ChartPoint[];
  title?: string | null;
  xLabel?: string | null;
  yLabel?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  width?: number;
  height?: number;
}

/*
 * Componente de gráfica reutilizable construido sobre D3.js.
 * Soporta los tipos: BAR, LINE, AREA, PIE y DONUT.
 * Los colores se interpolan entre primaryColor y secondaryColor para generar la paleta.
 */
export function D3Chart({
  type,
  data,
  title,
  xLabel,
  yLabel,
  primaryColor = "#16140f",
  secondaryColor = "#737373",
  width = 360,
  height = 280,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const svg = d3.select(svgRef.current);
    // Limpia el SVG antes de redibujar para evitar que elementos anteriores se acumulen
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    if (title) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#16140f")
        .text(title);
    }

    // El padding superior varía según si existe título para no superponer elementos
    const topPad = title ? 32 : 16;

    switch (type) {
      case "BAR":
        renderBar(
          svg,
          data,
          width,
          height,
          topPad,
          primaryColor,
          xLabel,
          yLabel,
        );
        break;
      case "LINE":
        renderLine(
          svg,
          data,
          width,
          height,
          topPad,
          primaryColor,
          secondaryColor,
          xLabel,
          yLabel,
        );
        break;
      case "AREA":
        renderArea(
          svg,
          data,
          width,
          height,
          topPad,
          primaryColor,
          secondaryColor,
          xLabel,
          yLabel,
        );
        break;
      case "PIE":
        renderPie(
          svg,
          data,
          width,
          height,
          topPad,
          primaryColor,
          secondaryColor,
          false,
        );
        break;
      // DONUT es igual que PIE pero con innerRadius > 0
      case "DONUT":
        renderPie(
          svg,
          data,
          width,
          height,
          topPad,
          primaryColor,
          secondaryColor,
          true,
        );
        break;
    }
  }, [
    type,
    data,
    title,
    xLabel,
    yLabel,
    primaryColor,
    secondaryColor,
    width,
    height,
  ]);

  return <svg ref={svgRef} style={{ overflow: "visible" }} />;
}

type Svg = d3.Selection<SVGSVGElement, unknown, null, undefined>;

// Dibuja una gráfica de barras verticales; un solo color para todas las barras
function renderBar(
  svg: Svg,
  data: ChartPoint[],
  width: number,
  height: number,
  topPad: number,
  color: string,
  xLabel?: string | null,
  yLabel?: string | null,
) {
  const maxLabelLen = Math.max(...data.map((d) => d.label.length));
  // Rota las etiquetas del eje X si hay muchos datos o las etiquetas son largas
  const rotate = data.length > 3 || maxLabelLen > 7;
  const margin = {
    top: topPad,
    right: 16,
    bottom: (rotate ? 70 : 40) + (xLabel ? 20 : 0),
    left: 48 + (yLabel ? 14 : 0),
  };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, innerW])
    .padding(0.25);
  const max = d3.max(data, (d) => d.value) ?? 0;
  const y = d3
    .scaleLinear()
    .domain([0, max * 1.15])
    .range([innerH, 0]);

  drawAxes(g, x, y, innerH, rotate, xLabel, yLabel, innerW);

  g.selectAll(".bar")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.label) ?? 0)
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerH - y(d.value))
    .attr("fill", color)
    .attr("rx", 2);

  g.selectAll(".bar-label")
    .data(data)
    .join("text")
    .attr("x", (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.value) - 4)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#16140f")
    .style("font-weight", "600")
    .text((d) => d.value);
}

// Dibuja una gráfica de líneas con puntos y etiquetas de valor sobre cada punto
function renderLine(
  svg: Svg,
  data: ChartPoint[],
  width: number,
  height: number,
  topPad: number,
  color: string,
  secondary: string,
  xLabel?: string | null,
  yLabel?: string | null,
) {
  const maxLabelLen = Math.max(...data.map((d) => d.label.length));
  const rotate = data.length > 3 || maxLabelLen > 7;
  const margin = {
    top: topPad,
    right: 16,
    bottom: (rotate ? 70 : 40) + (xLabel ? 20 : 0),
    left: 48 + (yLabel ? 14 : 0),
  };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scalePoint()
    .domain(data.map((d) => d.label))
    .range([0, innerW])
    .padding(0.5);
  const [minV, maxV] = d3.extent(data, (d) => d.value) as [number, number];
  const pad = (maxV - minV) * 0.15 || 1;
  const y = d3
    .scaleLinear()
    .domain([minV - pad, maxV + pad])
    .range([innerH, 0]);

  drawAxes(g, x, y, innerH, rotate, xLabel, yLabel, innerW);

  const lineGen = d3
    .line<ChartPoint>()
    .x((d) => x(d.label) ?? 0)
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.5)
    .attr("d", lineGen);

  g.selectAll(".dot")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.label) ?? 0)
    .attr("cy", (d) => y(d.value))
    .attr("r", 4)
    .attr("fill", "#fff")
    .attr("stroke", color)
    .attr("stroke-width", 2);

  g.selectAll(".dot-label")
    .data(data)
    .join("text")
    .attr("x", (d) => x(d.label) ?? 0)
    .attr("y", (d) => y(d.value) - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#16140f")
    .style("font-weight", "600")
    .text((d) => d.value);
}

// Dibuja una gráfica de área con degradado vertical del color primario a transparente
function renderArea(
  svg: Svg,
  data: ChartPoint[],
  width: number,
  height: number,
  topPad: number,
  color: string,
  secondary: string,
  xLabel?: string | null,
  yLabel?: string | null,
) {
  const maxLabelLen = Math.max(...data.map((d) => d.label.length));
  const rotate = data.length > 3 || maxLabelLen > 7;
  const margin = {
    top: topPad,
    right: 16,
    bottom: (rotate ? 70 : 40) + (xLabel ? 20 : 0),
    left: 48 + (yLabel ? 14 : 0),
  };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scalePoint()
    .domain(data.map((d) => d.label))
    .range([0, innerW])
    .padding(0.5);
  const max = d3.max(data, (d) => d.value) ?? 0;
  const y = d3
    .scaleLinear()
    .domain([0, max * 1.15])
    .range([innerH, 0]);

  drawAxes(g, x, y, innerH, rotate, xLabel, yLabel, innerW);

  const gradId = `area-grad-${Math.random().toString(36).slice(2, 8)}`;
  const grad = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", gradId)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  grad
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", color)
    .attr("stop-opacity", 0.6);
  grad
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", color)
    .attr("stop-opacity", 0.05);

  const areaGen = d3
    .area<ChartPoint>()
    .x((d) => x(d.label) ?? 0)
    .y0(innerH)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const lineGen = d3
    .line<ChartPoint>()
    .x((d) => x(d.label) ?? 0)
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", `url(#${gradId})`)
    .attr("d", areaGen);
  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.5)
    .attr("d", lineGen);

  g.selectAll(".dot")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.label) ?? 0)
    .attr("cy", (d) => y(d.value))
    .attr("r", 4)
    .attr("fill", "#fff")
    .attr("stroke", color)
    .attr("stroke-width", 2);
}

/*
 * Dibuja una gráfica de pastel (PIE) o dona (DONUT).
 * donut = true → innerRadius = 55% del radio → agujero central.
 * Incluye etiquetas de porcentaje en los segmentos ≥ 6% y una leyenda lateral.
 */
function renderPie(
  svg: Svg,
  data: ChartPoint[],
  width: number,
  height: number,
  topPad: number,
  primary: string,
  secondary: string,
  donut: boolean,
) {
  const margin = 16;
  const availH = height - topPad - margin;
  const radius = Math.min(width - margin * 2, availH) / 2 - 8;
  const cx = width / 2;
  const cy = topPad + availH / 2;

  // Genera una paleta de N colores interpolando entre primary y secondary
  const palette = interpolateColors(primary, secondary, data.length);
  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  const pie = d3
    .pie<ChartPoint>()
    .value((d) => d.value)
    .sort(null);

  const arc = d3
    .arc<d3.PieArcDatum<ChartPoint>>()
    .innerRadius(donut ? radius * 0.55 : 0)
    .outerRadius(radius);

  const labelArc = d3
    .arc<d3.PieArcDatum<ChartPoint>>()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.7);

  const arcs = pie(data);
  const total = d3.sum(data, (d) => d.value);

  g.selectAll(".slice")
    .data(arcs)
    .join("path")
    .attr("d", arc as any)
    .attr("fill", (_, i) => palette[i])
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  g.selectAll(".slice-label")
    .data(arcs)
    .join("text")
    .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", "#fff")
    .style("pointer-events", "none")
    .text((d) => {
      const pct = (d.data.value / total) * 100;
      return pct >= 6 ? `${Math.round(pct)}%` : "";
    });

  const legendG = svg
    .append("g")
    .attr("transform", `translate(${width - 8}, ${topPad})`);
  data.forEach((d, i) => {
    const row = legendG
      .append("g")
      .attr("transform", `translate(0, ${i * 14})`);
    row
      .append("rect")
      .attr("x", -110)
      .attr("y", 0)
      .attr("width", 9)
      .attr("height", 9)
      .attr("rx", 2)
      .attr("fill", palette[i]);
    row
      .append("text")
      .attr("x", -97)
      .attr("y", 8)
      .style("font-size", "10px")
      .style("fill", "#16140f")
      .text(d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label);
  });
}

/*
 * Agrega los ejes X e Y al grupo SVG.
 * Si rotate = true, inclina las etiquetas del eje X 35° para evitar solapamiento.
 * Añade las etiquetas de los ejes si se proporcionaron.
 */
function drawAxes(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.AxisScale<any>,
  y: d3.AxisScale<any>,
  innerH: number,
  rotate: boolean,
  xLabel: string | null | undefined,
  yLabel: string | null | undefined,
  innerW: number,
) {
  const xAxis = g
    .append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x as any));
  xAxis
    .selectAll("text")
    .style("font-size", "10px")
    .style("fill", "#737373")
    .attr("transform", rotate ? "rotate(-35)" : null)
    .attr("dx", rotate ? "-0.5em" : null)
    .attr("dy", rotate ? "0.25em" : null)
    .style("text-anchor", rotate ? "end" : "middle");
  xAxis.selectAll("path, line").style("stroke", "#d4d4d4");

  const yAxis = g.append("g").call(d3.axisLeft(y as any).ticks(5));
  yAxis.selectAll("text").style("font-size", "10px").style("fill", "#737373");
  yAxis.selectAll("path, line").style("stroke", "#d4d4d4");

  if (xLabel) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + (rotate ? 60 : 35))
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#737373")
      .text(xLabel);
  }
  if (yLabel) {
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#737373")
      .text(yLabel);
  }
}

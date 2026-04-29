"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
} from "lightweight-charts";
import { useCandles, useCurrentCandle } from "../../hooks/useSimulation";

export function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const candles = useCandles();
  const currentCandle = useCurrentCandle();

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#1e293b" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#334155" },
        horzLines: { color: "#334155" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#475569",
      },
      crosshair: {
        mode: 0,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      borderVisible: false,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const cs = candleSeriesRef.current;
    const vs = volumeSeriesRef.current;
    if (!cs || !vs) return;

    if (candles.length > 0) {
      const candleData: CandlestickData[] = candles.map((c) => ({
        time: (c.time / 60) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      cs.setData(candleData);

      const volData: HistogramData[] = candles.map((c) => ({
        time: (c.time / 60) as Time,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e44" : "#ef444444",
      }));
      vs.setData(volData);
    }

    if (currentCandle) {
      cs.update({
        time: (currentCandle.time / 60) as Time,
        open: currentCandle.open,
        high: currentCandle.high,
        low: currentCandle.low,
        close: currentCandle.close,
      });
      vs.update({
        time: (currentCandle.time / 60) as Time,
        value: currentCandle.volume,
        color:
          currentCandle.close >= currentCandle.open
            ? "#22c55e44"
            : "#ef444444",
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, currentCandle]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden border border-slate-700"
    />
  );
}

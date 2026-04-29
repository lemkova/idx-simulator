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
import { useCandles, useCurrentCandle, useSelectedStockId, useStockList } from "../../hooks/useSimulation";

export function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const candles = useCandles();
  const currentCandle = useCurrentCandle();
  const selectedId = useSelectedStockId();
  const stocks = useStockList();
  const stock = stocks.find((s) => s.stockId === selectedId);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#131a24" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1a2435" },
        horzLines: { color: "#1a2435" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1a2435",
      },
      rightPriceScale: {
        borderColor: "#1a2435",
      },
      crosshair: {
        mode: 0,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
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
        color: c.close >= c.open ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)",
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
            ? "rgba(16,185,129,0.3)"
            : "rgba(244,63,94,0.3)",
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, currentCandle]);

  return (
    <div className="panel flex-1 bg-term-panel border border-term-border rounded-lg flex flex-col overflow-hidden min-h-[300px]">
      <div className="h-10 shrink-0 border-b border-term-border flex items-center px-4 bg-white/[0.01]">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold text-white tracking-tight">
            {stock?.stockId ?? selectedId}
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">
            {stock?.name ?? ""}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 w-full"
      />
    </div>
  );
}

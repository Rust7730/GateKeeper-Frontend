import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { type ECharts, init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { WorkspacePreferences } from './workspace-preferences';

use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

export interface ThreatPoint {
  readonly day: string;
  readonly quarantined: number;
  readonly rejected: number;
}

export interface ThreatChartLabels {
  readonly quarantine: string;
  readonly rejected: string;
  readonly total: string;
}

/**
 * Tendencia de amenazas por día (líneas suaves con área degradada) con Apache ECharts (render SVG, sin canvas).
 * Los colores salen de los tokens CSS del panel y se recalculan al cambiar de tema.
 */
@Component({
  selector: 'gk-threat-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './threat-chart.html',
  styleUrl: './threat-chart.scss',
})
export class ThreatChart {
  readonly series = input.required<readonly ThreatPoint[]>();
  readonly labels = input.required<ThreatChartLabels>();
  /** Texto accesible de cada día (la gráfica es decorativa para lectores de pantalla). */
  readonly describe = input.required<(point: ThreatPoint) => string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly preferences = inject(WorkspacePreferences);
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private chart: ECharts | null = null;
  private frame = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.chart = init(this.canvas().nativeElement, undefined, { renderer: 'svg' });
      this.render();

      const resize = new ResizeObserver(() => this.chart?.resize());
      resize.observe(this.canvas().nativeElement);
      const scheme = window.matchMedia('(prefers-color-scheme: dark)');
      const onScheme = () => this.schedule();
      scheme.addEventListener('change', onScheme);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.frame);
        resize.disconnect();
        scheme.removeEventListener('change', onScheme);
        this.chart?.dispose();
        this.chart = null;
      });
    });

    // Datos, idioma, tema o movimiento: se vuelve a pintar (tras aplicar el atributo de tema).
    effect(() => {
      this.series();
      this.labels();
      this.preferences.theme();
      this.preferences.reducedMotion();
      this.schedule();
    });
  }

  private schedule(): void {
    if (!this.chart) return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.render());
  }

  /** Resuelve un token (que puede usar light-dark()) al color real que se ve en pantalla. */
  private color(token: string): string {
    const probe = document.createElement('i');
    probe.style.color = `var(${token})`;
    this.host.nativeElement.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }

  /** Mismo color con otra opacidad (los tokens resueltos llegan como rgb()). */
  private fade(color: string, alpha: number): string {
    const [r, g, b] = color.match(/[\d.]+/g)?.slice(0, 3) ?? ['128', '128', '128'];
    return `rgb(${r} ${g} ${b} / ${alpha})`;
  }

  private area(color: string) {
    return {
      color: {
        type: 'linear' as const,
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: this.fade(color, 0.32) },
          { offset: 1, color: this.fade(color, 0) },
        ],
      },
    };
  }

  private render(): void {
    if (!this.chart) return;

    const data = this.series();
    const labels = this.labels();
    const quarantine = this.color('--chart-quarantine');
    const rejected = this.color('--chart-rejected');
    const muted = this.color('--muted');
    const line = this.color('--stage-line');
    const surface = this.color('--surface');
    const ink = this.color('--ink');
    const font = getComputedStyle(this.host.nativeElement).fontFamily;
    const still =
      this.preferences.reducedMotion() ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dot = (colour: string) =>
      `<span style="display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:2px;background:${colour}"></span>`;

    this.chart.setOption(
      {
        animation: !still,
        animationDuration: 650,
        animationEasing: 'cubicOut',
        textStyle: { fontFamily: font },
        grid: { top: 14, right: 18, bottom: 2, left: 6, containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data.map((point) => point.day),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: line } },
          axisLabel: { color: muted, fontSize: 12, margin: 14 },
        },
        yAxis: {
          type: 'value',
          splitNumber: 4,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: muted, fontSize: 11 },
          splitLine: { lineStyle: { color: line, type: [4, 4], opacity: 0.6 } },
        },
        tooltip: {
          trigger: 'axis',
          confine: true,
          padding: [10, 12],
          backgroundColor: surface,
          borderColor: line,
          borderWidth: 1,
          textStyle: { color: ink, fontSize: 12 },
          extraCssText: 'border-radius:12px;box-shadow:0 12px 28px -14px rgb(10 13 22 / 45%);',
          axisPointer: {
            type: 'line',
            lineStyle: { color: muted, type: [3, 4], width: 1 },
          },
          formatter: (params: unknown) => {
            const rows = params as { dataIndex: number }[];
            const point = data[rows[0].dataIndex];
            return `<div style="font-weight:600;margin-bottom:6px">${point.day}</div>
              <div style="display:flex;justify-content:space-between;gap:20px">
                <span>${dot(quarantine)}${labels.quarantine}</span><b>${point.quarantined}</b></div>
              <div style="display:flex;justify-content:space-between;gap:20px">
                <span>${dot(rejected)}${labels.rejected}</span><b>${point.rejected}</b></div>
              <div style="display:flex;justify-content:space-between;gap:20px;margin-top:6px;padding-top:6px;border-top:1px solid ${line}">
                <span>${labels.total}</span><b>${point.quarantined + point.rejected}</b></div>`;
          },
        },
        series: [
          {
            name: labels.quarantine,
            type: 'line',
            smooth: 0.35,
            symbol: 'circle',
            symbolSize: 9,
            showSymbol: false,
            data: data.map((point) => point.quarantined),
            lineStyle: { width: 2.5, color: quarantine, cap: 'round' },
            itemStyle: { color: quarantine, borderColor: surface, borderWidth: 2 },
            areaStyle: this.area(quarantine),
            emphasis: { focus: 'series' },
          },
          {
            name: labels.rejected,
            type: 'line',
            smooth: 0.35,
            symbol: 'circle',
            symbolSize: 9,
            showSymbol: false,
            data: data.map((point) => point.rejected),
            lineStyle: { width: 2.5, color: rejected, cap: 'round' },
            itemStyle: { color: rejected, borderColor: surface, borderWidth: 2 },
            areaStyle: this.area(rejected),
            emphasis: { focus: 'series' },
          },
        ],
      },
      true,
    );
  }
}

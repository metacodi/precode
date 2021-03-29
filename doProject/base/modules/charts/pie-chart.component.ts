import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, EventEmitter, Self } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { BaseChartDirective, Label, SingleDataSet } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

import { AppConfig } from 'src/config';


export interface PieDataValue {
  /** Porcentaje */
  value: number;
  /** Valor formateado en la leyenda. Ej: `123,45 €` */
  display?: string;
  /** Etiqueta para la leyenda. */
  label?: string;
  /** Color del valor. */
  color?: string;
}


/**
 * Renderiza un gráfico de tipo `pie` o `doughnut`.
 *
 * ```html
 * <pie-chart type="pie" [values]="values" [total]="total"></pie-chart>
 * ```
 *
 * ```typescript
 * const values = [
 *  { value: 25.3, label: 'Efectivo', display: '123,45 €', color: '#4dc9f6' },
 *  { value: 74.7, label: 'Tarjeta', display: '364,50 €', color: '#f67019' }
 * ];
 * const total = { label: 'Semanal', display: '487,95 €' };
 * ```
 */
@Component({
  selector: 'pie-chart',
  templateUrl: 'pie-chart.component.html',
  styleUrls: ['pie-chart.component.scss'],
})
export class PieChartComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  @Input() set type(type: 'pie' | 'doughnut') { this.chartType = type; }

  @Input() set values(data: PieDataValue[]) {
    this.data = data;
    // Porcentajes.
    this.chartData = data.map(v => v.value);
    // Valores formateado en la leyenda. Ej: `123,45 €`
    this.chartDisplay = data.map(v => v.display);
    // Etiquetas para la leyenda.
    this.chartLabels = data.map(v => v.label);
    // Colores de cada valor.
    this.chartColors[0].backgroundColor = data.map(v => v.color);
    this.chartColors[0].borderWidth = data.map(v => 0);
  }
  data: PieDataValue[];

  @Input() set total(total: { label?: string, display: string }) { this.resume = total; }
  resume: { label?: string, display: string } = undefined;

  @ViewChild('container', { read: ElementRef, static: false }) container: ElementRef;
  @ViewChild(BaseChartDirective) chartWidget: any;

  chartType: ChartType = 'pie';
  chartData: SingleDataSet = [];
  chartLabels: Label[] = [];
  chartColors: any[] = [{ backgroundColor: [], borderWidth: [] }];
  /** Display labels on data for any type of charts. */
  chartPlugins = [pluginDataLabels];
  /** Ocultamos la leyenda para crear nuestra propia leyenda responsiva. */
  chartLegend = false;
  /** Valores formateados que se muestran en la leyenda. */
  chartDisplay: string[];
  chartOptions: ChartOptions = {
    responsive: true,
    aspectRatio: 1,
    plugins: { datalabels: {
      formatter: (value, ctx) => `${value}%`
    }}
  };

  initialized = false;
  initSubscription: Subscription;

  height: number = undefined;
  @Output() heightChanged = new EventEmitter<{ detail: { value: number }}>();
  @HostListener('window:resize') onResize(): void { this.calculateHeight(); }

  constructor(
    public el: ElementRef,
  ) {}

  ngOnInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnInit()'); }
    this.initChart();
  }

  ngOnDestroy() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnDestroy()'); }
    if (this.initSubscription) { this.initSubscription.unsubscribe(); }
  }

  initChart() {
    if (this.debug) { console.log(this.constructor.name + '.initChart() => ', { widget: this.chartWidget }); }
    // Nos aseguramos que se renderiza el gráfico de progresión.
    if (!this.initialized) {
      this.initSubscription = timer(300).subscribe(() => {
        if (this.debug) { console.log(this.constructor.name + '.initChart() -> timer() => ', { widget: this.chartWidget }); }
        if (this.chartWidget) {
          if (this.chartWidget.chart && this.chartWidget.chart.width && this.chartWidget.chart.height) {
            if (this.debug) { console.log(this.constructor.name + '.initChart() -> timer() => this.initialized', { widget: this.chartWidget, width: this.chartWidget.chart.width, height: this.chartWidget.chart.height }); }
            this.initSubscription.unsubscribe();
            this.initialized = true;
            this.calculateHeight();
          } else {
            if (this.debug) { console.log(this.constructor.name + '.initChart() -> timer() => this.chartWidget.refresh()', { widget: this.chartWidget, width: this.chartWidget && this.chartWidget.chart ? this.chartWidget.chart.width : NaN, height: this.chartWidget && this.chartWidget.chart ? this.chartWidget.chart.height : NaN }); }
            this.initChart();
          }
        } else {
          if (this.debug) { console.log(this.constructor.name + '.initChart() -> timer() => this.initChart()', { widget: this.chartWidget, width: this.chartWidget && this.chartWidget.chart ? this.chartWidget.chart.width : NaN, height: this.chartWidget && this.chartWidget.chart ? this.chartWidget.chart.height : NaN }); }
          this.initChart();
        }
      });
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  calculate height
  // ---------------------------------------------------------------------------------------------------

  calculateHeight(): void {
    if (this.height !== this.container.nativeElement.offsetHeight) {
      this.height = this.container.nativeElement.offsetHeight;
      this.heightChanged.emit({ detail: { value: this.height }});
    }
  }

}

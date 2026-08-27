import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Character } from '../../../services/character.service';
import type { CharacterHistorySeries, HistoryEra, HistoryPoint, ChatHistoryChart } from '../chat-history-chart';

@Component({ selector: 'app-history-data-plot', imports: [CommonModule], templateUrl: './history-data-plot.html', styleUrl: './history-data-plot.scss' })
export class HistoryDataPlot {
  @Input({ required: true }) chart!: ChatHistoryChart;
  private readonly chartWidth=1100; private readonly plotLeft=200; private readonly plotRight=1070;
  private readonly rowHeight=60; private readonly firstRowHeight=70; private readonly topPadding=52; private readonly bottomPadding=24;
  private readonly droughtStart=new Date('2026-04-21T12:00:00'); private readonly droughtEnd=new Date('2026-05-06T12:00:00');
  private readonly pointsCache=new Map<string,HistoryPoint[]>();
  private readonly formatter=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'});
  private maximumKey=''; private maximumValue=1; private colorKey=''; private readonly colors=new Map<number,string>();

  get chartViewBox(){return `0 0 ${this.chartWidth} ${this.axisY+this.bottomPadding}`}
  get axisY(){return this.chart.displayedSeries.length===0?this.topPadding:this.topPadding+this.firstRowHeight+(this.chart.displayedSeries.length-1)*this.rowHeight}
  get plotStartX(){return this.plotLeft} get plotEndX(){return this.plotRight} get droughtY(){return this.topPadding}
  get droughtHeight(){return this.axisY-this.topPadding} get droughtLabelY(){return this.topPadding-14}
  get droughtStartX(){return Math.max(this.plotLeft,this.dayBoundaryX(this.droughtStart))} get droughtEndX(){return Math.min(this.plotRight,this.dayBoundaryX(this.droughtEnd))}
  get showDrought(){const [start,end]=this.extent;return this.droughtStart<=end&&this.droughtEnd>=start}
  get visibleEras():HistoryEra[]{const [start,end]=this.extent;return [
    {label:'5.3',start:this.fromKey(this.chart.datasetStartDate),end:new Date('2026-04-21T12:00:00'),className:'era-53'},
    {label:'5.5',start:new Date('2026-05-06T12:00:00'),end:new Date('2026-08-06T12:00:00'),className:'era-55'},
    {label:'5.6',start:new Date('2026-08-06T12:00:00'),end:this.fromKey(this.chart.datasetEndDate),className:'era-56'}
  ].filter(era=>era.start<=end&&era.end>=start)}

  displayedPoints(item:CharacterHistorySeries):HistoryPoint[]{const [start,end]=this.extent;const total=this.dayNumber(end)-this.dayNumber(start)+1;const days=Math.max(1,Math.ceil(total/60));const key=`${item.character.id}|${this.chart.selectedStartDate}|${this.chart.selectedEndDate}|${days}`;const cached=this.pointsCache.get(key);if(cached)return cached;if(this.pointsCache.size>this.chart.displayedSeries.length*3)this.pointsCache.clear();const buckets=new Map<number,HistoryPoint>();item.points.filter(p=>this.isVisible(p.date)).forEach(point=>{const index=Math.floor((this.dayNumber(point.date)-this.dayNumber(start))/days);const bucketStart=new Date(start);bucketStart.setDate(bucketStart.getDate()+index*days);const proposed=new Date(bucketStart);proposed.setDate(proposed.getDate()+days-1);const bucketEnd=proposed>end?new Date(end):proposed;const existing=buckets.get(index);if(existing)existing.count+=point.count;else buckets.set(index,{date:bucketStart,endDate:bucketEnd,dateKey:`${this.toKey(bucketStart)}-${this.toKey(bucketEnd)}`,count:point.count})});const points=[...buckets.values()];this.pointsCache.set(key,points);return points}
  visibleCount(item:CharacterHistorySeries){return item.points.filter(p=>this.isVisible(p.date)).reduce((sum,p)=>sum+p.count,0)}
  rowY(index:number){return this.topPadding+this.firstRowHeight/2+index*this.rowHeight}
  eraStartX(era:HistoryEra){return Math.max(this.plotLeft,this.dayBoundaryX(era.start))}
  eraEndX(era:HistoryEra){return era.end>=this.fromKey(this.chart.datasetEndDate)?this.plotRight:Math.min(this.plotRight,this.dayBoundaryX(era.end))}
  barX(point:HistoryPoint){const [start]=this.extent;const {bucketDays,bucketCount}=this.geometry;const index=Math.floor((this.dayNumber(point.date)-this.dayNumber(start))/bucketDays);return this.plotLeft+index/bucketCount*(this.plotRight-this.plotLeft)}
  get barWidth(){return (this.plotRight-this.plotLeft)/this.geometry.bucketCount}
  barHeight(point:HistoryPoint){return Math.max(7,point.count/this.maximum*34)}
  color(id:number){const key=this.chart.series.map(item=>item.character.id).join(',');if(key!==this.colorKey){this.colors.clear();const palette=['#2563eb','#db2777','#059669','#d97706','#7c3aed','#0891b2','#dc2626'];this.chart.series.forEach((item,index)=>this.colors.set(item.character.id,palette[index%palette.length]));this.colorKey=key}return this.colors.get(id)??'#2563eb'}
  iconPath(character:Character){return character.img?`assets/Icons/${character.img}`:'assets/Icons/extended/Unknown.png'}
  useUnknownIcon(event:Event){(event.currentTarget as SVGImageElement).setAttribute('href','assets/Icons/extended/Unknown.png')}
  formatDate(date:Date){return this.formatter.format(date)}
  formatPointDate(point:HistoryPoint){return !point.endDate||point.date.getTime()===point.endDate.getTime()?this.formatDate(point.date):`${this.formatDate(point.date)}–${this.formatDate(point.endDate)}`}
  private get extent():[Date,Date]{return [this.fromKey(this.chart.selectedStartDate),this.fromKey(this.chart.selectedEndDate)]}
  private get geometry(){const [start,end]=this.extent;const total=this.dayNumber(end)-this.dayNumber(start)+1;const bucketDays=Math.max(1,Math.ceil(total/60));return{bucketDays,bucketCount:Math.ceil(total/bucketDays)}}
  private get maximum(){const key=`${this.chart.selectedStartDate}|${this.chart.selectedEndDate}|${this.chart.displayedSeries.map(item=>item.character.id).join(',')}`;if(key!==this.maximumKey){this.maximumValue=Math.max(1,...this.chart.displayedSeries.flatMap(item=>this.displayedPoints(item).map(point=>point.count)));this.maximumKey=key}return this.maximumValue}
  private isVisible(date:Date){const [start,end]=this.extent;return date>=start&&date<=end}
  private dayBoundaryX(date:Date){const [start,end]=this.extent;const total=this.dayNumber(end)-this.dayNumber(start)+1;return this.plotLeft+(this.dayNumber(date)-this.dayNumber(start))/total*(this.plotRight-this.plotLeft)}
  private dayNumber(date:Date){return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000}
  private fromKey(key:string){return new Date(`${key}T12:00:00`)}
  private toKey(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
}

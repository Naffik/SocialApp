import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {

  private months: string[] = [
    'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
  ];

  transform(value: any, includeTime: boolean = true): any {
    const date = new Date(value);
    const day = this.pad(date.getDate());
    const month = this.months[date.getMonth()]; 
    const year = date.getFullYear();

    if (includeTime) {
      const hours = this.pad(date.getHours());
      const minutes = this.pad(date.getMinutes());
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } else {
      return `${day} ${month} ${year}`;
    }
  }

  pad(number: number): string {
    return (number < 10) ? '0' + number : number.toString();
  }
}

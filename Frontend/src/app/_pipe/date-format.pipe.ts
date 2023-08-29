import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {

  private months: string[] = [
    'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
  ];

  transform(value: any): any {
    const date = new Date(value);
    const day = this.pad(date.getDate());
    const month = this.months[date.getMonth()]; // Miesiące są indeksowane od 0 do 11
    const year = date.getFullYear();
    const hours = this.pad(date.getHours());
    const minutes = this.pad(date.getMinutes());

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  pad(number: number): string {
    return (number < 10) ? '0' + number : number.toString();
  }
}

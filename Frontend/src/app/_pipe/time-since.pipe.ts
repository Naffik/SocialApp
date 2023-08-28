import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeSince'
})
export class TimeSincePipe implements PipeTransform {

  transform(value: any): string {
    const now = new Date().getTime();
    const seconds = Math.floor((now - new Date(value).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return `${days} dni`;
    } else if (days === 1) {
      return `1 dzień`;
    } else if (hours >= 1) {
      return `${hours} g.`;
    } else if (minutes >= 1) {
      return `${minutes} min`;
    } else {
      return `${seconds} sek`;
    }
  }
}

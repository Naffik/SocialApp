import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from 'src/app/_services/data.service';
import { environment } from 'src/environments/environment.development';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.css']
})
export class TrendsComponent implements OnInit, OnDestroy {

  trends: any[] = [];
  baseUrl = environment.apiUrl;
  private unsubscribe$ = new Subject<void>();
  isLoading: boolean = true;


  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTrends();
    this.refreshTrends().subscribe(
      (data: any) => {
        this.trends = data.popular_tags;
      },
      (error) => {
        console.log('Błąd podczas ładowania trendów.');
      }
    );
  }

  refreshTrends() {
    return interval(300000).pipe(
      takeUntil(this.unsubscribe$),
      switchMap(() => this.dataService.getData(this.baseUrl + '/api/popular-tags/?tags_count=10&time_in_hours=12'))
    );
  }
  

  loadTrends() {
    this.isLoading = true;
    this.dataService.getData(this.baseUrl + '/api/popular-tags/?tags_count=10&time_in_hours=12').subscribe(
      (data: any) => {
        this.trends = data.popular_tags;
        this.isLoading = false;
      },
      (error) => {
        console.log('Błąd podczas ładowania trendów.');
        this.isLoading = false;
      }
    );
  } 

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onTrendClick(trend: string): void {
    this.router.navigate(['/search'], { queryParams: { query: trend } });
  }
  
}

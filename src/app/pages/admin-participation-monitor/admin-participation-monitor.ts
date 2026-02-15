import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ActivitiesService } from '../../services/activities.service';
import { REGISTRATION_TIMELINE_DATA } from '../../data/activities.data';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-participation-monitor',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './admin-participation-monitor.html',
  styleUrl: './admin-participation-monitor.css',
})
export class AdminParticipationMonitorPage implements AfterViewInit, OnInit {
  @ViewChild('timelineChart') timelineChartRef!: ElementRef<HTMLCanvasElement>;
  private timelineChart?: Chart;
  private activitiesService = inject(ActivitiesService);

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  private allTimelineData = REGISTRATION_TIMELINE_DATA;

  ngOnInit() {
    this.activitiesService.activities$.subscribe(() => {
      // Future: Update timeline when activities change
    });

    // Set default to last 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    this.dateRange.setValue({
      start: sevenDaysAgo,
      end: today,
    });

    // Listen to date range changes
    this.dateRange.valueChanges.subscribe(() => {
      this.updateChartData();
    });
  }

  ngAfterViewInit() {
    this.initTimelineChart();
  }

  private initTimelineChart() {
    const filteredData = this.getFilteredData();
    const labels = filteredData.map((d) => this.formatDate(d.date));
    const data = filteredData.map((d) => d.registrations);

    this.timelineChart = new Chart(this.timelineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Registrations',
            data: data,
            borderColor: '#27619b',
            backgroundColor: 'rgba(38, 97, 155, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#27619b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#1e4a73',
            pointHoverBorderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'white',
            titleColor: '#000',
            bodyColor: '#000',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: (context) => {
                return `Registrations: ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6',
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
        },
      },
    });
  }

  private getFilteredData() {
    const startDate = this.dateRange.value.start;
    const endDate = this.dateRange.value.end;

    if (!startDate || !endDate) {
      return this.allTimelineData;
    }

    // Normalize dates to midnight for proper comparison
    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(23, 59, 59, 999);

    return this.allTimelineData.filter((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate >= normalizedStart && itemDate <= normalizedEnd;
    });
  }

  private updateChartData() {
    if (!this.timelineChart) return;

    const filteredData = this.getFilteredData();
    const labels = filteredData.map((d) => this.formatDate(d.date));
    const data = filteredData.map((d) => d.registrations);

    this.timelineChart.data.labels = labels;
    this.timelineChart.data.datasets[0].data = data;
    this.timelineChart.update();
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  ngOnDestroy() {
    if (this.timelineChart) {
      this.timelineChart.destroy();
    }
  }
}

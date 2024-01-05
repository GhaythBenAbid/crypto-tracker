import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoDetailsComponent } from './crypto-details.component';

describe('CryptoDetailsComponent', () => {
  let component: CryptoDetailsComponent;
  let fixture: ComponentFixture<CryptoDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CryptoDetailsComponent]
    });
    fixture = TestBed.createComponent(CryptoDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

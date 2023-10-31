import { TestBed } from '@angular/core/testing';

import { ModalCommunicationServiceService } from './modal-communication-service.service';

describe('ModalCommunicationServiceService', () => {
  let service: ModalCommunicationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalCommunicationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

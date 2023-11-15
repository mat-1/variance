class EventLimit {
  private _from: number;

  private readonly SMALLEST_EVT_HEIGHT: number;

  private readonly PAGES_COUNT: number;

  constructor() {
    this._from = 0;

    this.SMALLEST_EVT_HEIGHT = 32;
    this.PAGES_COUNT = 4;
  }

  get maxEvents() {
    return Math.round(document.body.clientHeight / this.SMALLEST_EVT_HEIGHT) * this.PAGES_COUNT;
  }

  get from() {
    return this._from;
  }

  get length() {
    return this._from + this.maxEvents;
  }

  setFrom(from: number) {
    this._from = from < 0 ? 0 : from;
  }

  paginate(backwards: boolean, limit: number, timelineLength: number) {
    this._from = backwards ? this._from - limit : this._from + limit;

    if (!backwards && this.length > timelineLength) {
      this._from = timelineLength - this.maxEvents;
    }
    if (this._from < 0) this._from = 0;
  }
}

export default EventLimit;

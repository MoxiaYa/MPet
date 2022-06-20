const _ = require("lodash");
const moment = require("moment");
class SayController {
  constructor(say, random, base) {
    this.say = say;
    this.sayList = [];
    this.sayTimer = null;
    this.heartTimer = null;
    this.random = random;
    this.saying = false;
    this.base = base;
    this.hasTimingSay = []; // 已经消费的定时任务
    this.startHeartbeat();
    this.startSayTimer();
  }

  startSayTimer() {
    this.sayTimer = setTimeout(() => {
      clearTimeout(this.sayTimer);
      if (!this.saying && this.sayList.length) {
        this.saying = true;
        const info = this.sayList.pop();
        const time = (+info.time || 2) * 1000;
        this.say({ ...info, time });
        const timer = setTimeout(() => {
          clearTimeout(timer);
          this.saying = false;
        }, time + 500);
      }
      this.startSayTimer();
    }, 500);
  }

  pushSayList(info) {
    this.sayList.push(info);
  }

  sayOne() {
    if (this.saying || !this.random.length) return;
    let random = this.random.filter((i) => i.enabled);
    if (!random.length) return;
    const timings = random.filter((i) => i.type === "timing");
    const timeInfo = this.checkTimings(timings);
    if (timeInfo) {
      timeInfo.forEach((i) => {
        this.pushSayList(i);
      });
    } else {
      random = random.filter((i) => i.type !== "timing");
      if (!random.length) return;
      const idx = _.random(0, random.length - 1);
      const info = random[idx];
      if (!info) return;
      const base = _.random(1, 500);
      if (base > this.base) return;
      this.pushSayList(info);
    }
  }

  checkTimings(timings) {
    if (!timings || !timings.length) return false;
    const nowTime = moment().format("HH:mm");
    const infos = timings.filter((i) => i.param === nowTime);
    if (!infos || !infos.length) return false;
    const res = [];
    infos.forEach((i) => {
      const key = `${moment().format("MMDD_HH:mm")}_${i.id}`;
      if (!this.hasTimingSay.includes(key)) {
        this.hasTimingSay.push(key);
        if (this.hasTimingSay.length >= 100) {
          this.hasTimingSay.shift();
        }
        res.push(i);
      }
    });
    if (!res || !res.length) return false;
    return res;
  }

  startHeartbeat() {
    this.heartTimer = setTimeout(() => {
      clearTimeout(this.heartTimer);
      this.sayOne();
      this.startHeartbeat();
    }, 1000);
  }
}

module.exports = SayController;

import {classSession} from './classSession'
import {coach} from './coach'
import {discipline} from './discipline'
import {faqItem} from './faqItem'
import {notice} from './notice'
import {priceGroup} from './priceGroup'
import {pricingPage} from './pricingPage'
import {scheduleRelease} from './scheduleRelease'
import {sessionException} from './sessionException'
import {siteSettings} from './siteSettings'

export const schemaTypes = [
  siteSettings, pricingPage, scheduleRelease, discipline, coach, priceGroup, faqItem,
  classSession, sessionException, notice,
]

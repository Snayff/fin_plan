-- AddForeignKey
ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_giftPersonId_fkey" FOREIGN KEY ("giftPersonId") REFERENCES "GiftPerson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftYearRecord" ADD CONSTRAINT "GiftYearRecord_giftEventId_fkey" FOREIGN KEY ("giftEventId") REFERENCES "GiftEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

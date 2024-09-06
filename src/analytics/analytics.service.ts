import { AppUser } from '../appUser/appUser.schema';
import { PointCardService } from '../point-card/point-card.service';
import { CustomerPointCardService } from '../customer-point-card/customer-point-card.service';
import { I18nService } from 'nestjs-i18n';
import { Injectable } from '@nestjs/common';

/**
 *  * Datei: analytics.service.ts
 * Autor: Basil Peter
 * Datum: 24.08.2024
 *
 * Der AnalyticsService enthält die Geschäftslogik zur Berechnung
 * und Aggregation von Analysedaten für die PointCards eines Unternehmens.
 */
@Injectable()
export class AnalyticsService {
  // Konstruktor injiziert die benötigten Services für die Verarbeitung
  constructor(
    private readonly businessPointCardService: PointCardService,
    private readonly customerPointCardService: CustomerPointCardService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Diese Methode berechnet die Gesamtpunkte aller Treuekarten
   * (BusinessPointCards) eines Unternehmens, das dem Benutzer gehört.
   *
   * @param user Der aktuelle Benutzer, dessen Unternehmens-Treuekarten analysiert werden sollen.
   * @returns Eine Liste von Objekten, die den Namen der Treuekarte und die entsprechenden Gesamtpunkte enthält.
   */
  async calculateTotalPointsForAllBusinessPointCards(user: AppUser) {
    // Schritt 1: Abrufen aller BusinessPointCards, die dem Unternehmen des Benutzers zugeordnet sind
    const allBusinessPointCards =
      await this.businessPointCardService.findAllbyUserCompany(
        user.company.toString(),
      );

    const results = [];

    // Schritt 2: Für jede BusinessPointCard die Gesamtpunkte aller zugehörigen CustomerPointCards berechnen
    for (const businessPointCard of allBusinessPointCards) {
      // Gesamtpunkte der aktuellen BusinessPointCard berechnen
      const totalPoints = await this.customerPointCardService.countTotalPoints(
        businessPointCard._id.toString(),
      );

      // Ergebnis speichern: Name der BusinessPointCard und die berechneten Gesamtpunkte
      results.push({
        businessPointCardName: businessPointCard.name,
        totalPoints: totalPoints,
      });
    }

    // Rückgabe der aggregierten Ergebnisse
    return results;
  }
}

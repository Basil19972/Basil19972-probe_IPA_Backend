import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { JwtAuthGuard } from '../security/jwt.guard';
import { User } from '../appUser/appUser.decorator';
import { AppUser } from '../appUser/appUser.schema';
import { AnalyticsService } from './analytics.service';
import { Controller, Get, UseGuards } from '@nestjs/common';

/**
 * Datei: analytics.controller.ts
 * Autor: Basil Peter
 * Datum: 04.09.2024
 *
 * Der AnalyticsController ist für die Verarbeitung von Anfragen
 * im Zusammenhang mit Analysefunktionen verantwortlich.
 * Er enthält Endpunkte, die es ermöglichen, spezifische Analyse-
 * daten für den angemeldeten Benutzer abzurufen.
 */
@Controller('analytics')
export class AnalyticsController {
  // Der AnalyticsService wird in diesem Controller verwendet, um die Geschäftslogik zu handhaben.
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Endpunkt: GET /analytics/pointsByPointCrads
   *
   * Dieser Endpunkt ruft die Gesamtpunktzahl für alle Treuekarten
   * eines Unternehmens ab, basierend auf den Daten des aktuellen Benutzers.
   *
   * Guards:
   * - JwtAuthGuard: Stellt sicher, dass nur authentifizierte Benutzer auf diesen Endpunkt zugreifen können.
   * - AbilitiesGuard: Überprüft die spezifischen Berechtigungen des Benutzers für diesen Endpunkt.
   *
   * Abilities:
   * - CheckAbilities: Stellt sicher, dass der Benutzer die Berechtigung hat,
   *   auf Analysedaten zuzugreifen (READ-Aktion auf das Subjekt 'analytics').
   *
   * @param user Die Instanz des aktuell authentifizierten Benutzers, abgeleitet aus dem JWT.
   * @returns Ein Objekt, das die aggregierten Punktzahlen für alle Geschäftstreuekarten des Benutzers enthält.
   */
  @Get('pointsByPointCrads')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: 'analytics' })
  async getPointsByBusinessPointCard(@User() user: AppUser) {
    // Ruft die gesamte Punktzahl für alle Treuekarten des Unternehmens des Benutzers ab.
    const points =
      await this.analyticsService.calculateTotalPointsForAllBusinessPointCards(
        user,
      );

    return points;
  }
}

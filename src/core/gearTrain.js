/**
 * Lógica de 2 o más engranajes + distancia de centros
 */
export class GearTrain {
    constructor(gears = []) {
        this.gears = gears;
    }

    calculateCenterDistance(gear1, gear2) {
        return gear1.getCenterDistanceWith(gear2);
    }

    getTransmissionRatio() {
        if (this.gears.length < 2) return 1;
        // Relación i = Z2 / Z1
        return this.gears[1].params.teeth / this.gears[0].params.teeth;
    }
}

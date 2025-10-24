"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTimeEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_time_entry_dto_1 = require("./create-time-entry.dto");
class UpdateTimeEntryDto extends (0, swagger_1.PartialType)(create_time_entry_dto_1.CreateTimeEntryDto) {
}
exports.UpdateTimeEntryDto = UpdateTimeEntryDto;
//# sourceMappingURL=update-time-entry.dto.js.map
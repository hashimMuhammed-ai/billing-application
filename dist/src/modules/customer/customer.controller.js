"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const addcustomer_parser_1 = require("./parsers/addcustomer.parser");
const create_customer_usecase_1 = require("./application/create-customer.usecase");
const find_customer_usecase_1 = require("./application/find-customer.usecase");
const list_customers_usecase_1 = require("./application/list-customers.usecase");
let CustomerController = class CustomerController {
    addCustomerParser;
    createCustomerUseCase;
    findCustomerUseCase;
    listCustomersUseCase;
    constructor(addCustomerParser, createCustomerUseCase, findCustomerUseCase, listCustomersUseCase) {
        this.addCustomerParser = addCustomerParser;
        this.createCustomerUseCase = createCustomerUseCase;
        this.findCustomerUseCase = findCustomerUseCase;
        this.listCustomersUseCase = listCustomersUseCase;
    }
    async parseAndCreate(rawText) {
        if (!rawText) {
            throw new common_1.BadRequestException('Field "rawText" is required.');
        }
        const parseResult = this.addCustomerParser.parse(rawText);
        if (!parseResult.success || !parseResult.dto) {
            throw new common_1.BadRequestException({
                message: 'Customer text parsing failed',
                errors: parseResult.errors,
            });
        }
        const customer = await this.createCustomerUseCase.execute(parseResult.dto);
        return {
            customer,
            warnings: parseResult.warnings,
        };
    }
    async create(dto) {
        if (!dto.name || !dto.address || !dto.state) {
            throw new common_1.BadRequestException('Name, address, and state are required fields.');
        }
        return this.createCustomerUseCase.execute(dto);
    }
    async findAll() {
        return this.listCustomersUseCase.execute();
    }
    async findByName(name) {
        if (!name) {
            throw new common_1.BadRequestException('Query parameter "name" is required.');
        }
        return this.findCustomerUseCase.execute(name);
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, common_1.Post)('parse-and-create'),
    __param(0, (0, common_1.Body)('rawText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "parseAndCreate", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('find'),
    __param(0, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "findByName", null);
exports.CustomerController = CustomerController = __decorate([
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [addcustomer_parser_1.AddCustomerParser,
        create_customer_usecase_1.CreateCustomerUseCase,
        find_customer_usecase_1.FindCustomerUseCase,
        list_customers_usecase_1.ListCustomersUseCase])
], CustomerController);
//# sourceMappingURL=customer.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const customer_repository_1 = require("./infrastructure/customer.repository");
const addcustomer_parser_1 = require("./parsers/addcustomer.parser");
const create_customer_usecase_1 = require("./application/create-customer.usecase");
const find_customer_usecase_1 = require("./application/find-customer.usecase");
const list_customers_usecase_1 = require("./application/list-customers.usecase");
const customer_controller_1 = require("./customer.controller");
let CustomerModule = class CustomerModule {
};
exports.CustomerModule = CustomerModule;
exports.CustomerModule = CustomerModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [customer_controller_1.CustomerController],
        providers: [
            customer_repository_1.CustomerRepository,
            addcustomer_parser_1.AddCustomerParser,
            create_customer_usecase_1.CreateCustomerUseCase,
            find_customer_usecase_1.FindCustomerUseCase,
            list_customers_usecase_1.ListCustomersUseCase,
        ],
        exports: [
            customer_repository_1.CustomerRepository,
            addcustomer_parser_1.AddCustomerParser,
            create_customer_usecase_1.CreateCustomerUseCase,
            find_customer_usecase_1.FindCustomerUseCase,
            list_customers_usecase_1.ListCustomersUseCase,
        ],
    })
], CustomerModule);
//# sourceMappingURL=customer.module.js.map
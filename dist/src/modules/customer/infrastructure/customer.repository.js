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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let CustomerRepository = class CustomerRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.customer.create({
            data: {
                name: data.name,
                address: data.address,
                gstin: data.gstin ?? null,
                state: data.state,
                phone: data.phone ?? null,
            },
        });
    }
    async findByNamePartial(name) {
        const searchTerm = name.trim();
        if (!searchTerm) {
            return [];
        }
        return this.prisma.customer.findMany({
            where: {
                name: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }
    async findAll() {
        return this.prisma.customer.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }
    async findById(id) {
        return this.prisma.customer.findUnique({
            where: { id },
        });
    }
};
exports.CustomerRepository = CustomerRepository;
exports.CustomerRepository = CustomerRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerRepository);
//# sourceMappingURL=customer.repository.js.map
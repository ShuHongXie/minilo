import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from './modules/user/user.module'
import { JwtModule } from '@nestjs/jwt'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AuthGuard } from '@guard/auth.guard'
import { CacheModule } from './modules/cache/cache.module'
import { MenuModule } from './modules/menu/menu.module'
import { RoleModule } from './modules/role/role.module'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { StringToNullInterceptor } from './common/interceptor/stringToNull.interceptor'
import { LogModule } from './modules/log/log.module'
import { OperationLogInterceptor } from '@interceptor/log.interceptor'
import { UploadModule } from './modules/upload/upload.module'
import { MockModule } from './modules/mock/mock.module'
@Module({
  imports: [
    // 加载环境变量配置
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`
    }),
    // mysql链接
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('MYSQL_HOST'),
        port: 3306, // 端口号
        username: 'root', // 用户名
        password: '13005322685', // 密码
        database: configService.get<string>('MYSQL_DATABASE'),
        entities: ['**/*.entity.js'], //数据库对应的Entity
        autoLoadEntities: true,
        synchronize: true, //是否自动同步实体文件,生产环境建议关闭
        namingStrategy: new SnakeNamingStrategy() // 应用自定义命名策略
      })
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get('JWT_EXP')
          }
        }
      }
    }),
    UserModule,
    CacheModule,
    MenuModule,
    RoleModule,
    LogModule,
    UploadModule,
    MockModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor
    },
    // 注册全局拦截器：处理空字符串转null
    {
      provide: APP_INTERCEPTOR,
      useClass: StringToNullInterceptor
    },
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule {}

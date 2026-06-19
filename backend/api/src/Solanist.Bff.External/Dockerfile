FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/Solanist.Domain/Solanist.Domain.csproj src/Solanist.Domain/
COPY src/Solanist.Application/Solanist.Application.csproj src/Solanist.Application/
COPY src/Solanist.Infrastructure/Solanist.Infrastructure.csproj src/Solanist.Infrastructure/
COPY src/Solanist.Bff.Shared/Solanist.Bff.Shared.csproj src/Solanist.Bff.Shared/
COPY src/Solanist.Bff.External/Solanist.Bff.External.csproj src/Solanist.Bff.External/

RUN dotnet restore src/Solanist.Bff.External/Solanist.Bff.External.csproj

COPY src/ src/
RUN dotnet publish src/Solanist.Bff.External/Solanist.Bff.External.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS production
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["dotnet", "Solanist.Bff.External.dll"]

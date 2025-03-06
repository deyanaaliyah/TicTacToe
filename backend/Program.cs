using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using backend.Services;
using backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSingleton<GameService>(); // Ensures game state persists
builder.Services.AddSignalR();

// Configure CORS **before** building the app
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000", "http://192.168.8.134:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                      });
});

var app = builder.Build();

app.UseCors(MyAllowSpecificOrigins);

app.UseWebSockets();
app.UseRouting();

app.MapHub<GameHub>("/gamehub");  // Map the SignalR hub endpoint
app.MapControllers();

app.Run();

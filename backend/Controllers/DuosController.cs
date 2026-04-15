using Microsoft.AspNetCore.Mvc;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CharacterSelectAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DuosController : ControllerBase
{
    private readonly string _duosFilePath;
    private readonly ILogger<DuosController> _logger;

    public DuosController(ILogger<DuosController> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        // Navigate from backend folder to src/assets/data/duos.json
        _duosFilePath = Path.Combine(env.ContentRootPath, "..", "src", "assets", "data", "duos.json");
    }

    [HttpGet]
    public async Task<IActionResult> GetDuos()
    {
        try
        {
            var jsonData = await System.IO.File.ReadAllTextAsync(_duosFilePath);
            var duosData = JsonSerializer.Deserialize<JsonElement>(jsonData);
            return Ok(duosData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading duos.json");
            return StatusCode(500, new { error = "Failed to read duos" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> AddDuo([FromBody] DuoRequest newDuo)
    {
        try
        {
            // Validate the duo
            if (!newDuo.Id1.HasValue || !newDuo.Id2.HasValue || string.IsNullOrEmpty(newDuo.Name))
            {
                return BadRequest(new { error = "Missing required fields: id1, id2, name" });
            }

            // Read existing duos
            var jsonData = await System.IO.File.ReadAllTextAsync(_duosFilePath);
            var duosData = JsonSerializer.Deserialize<DuosData>(jsonData);

            if (duosData?.Duos == null)
            {
                return StatusCode(500, new { error = "Invalid duos data structure" });
            }

            // Check for duplicates
            var exists = duosData.Duos.Any(duo => 
                duo.Id1 == newDuo.Id1 && duo.Id2 == newDuo.Id2);

            if (exists)
            {
                return Conflict(new { error = "This duo pair already exists!" });
            }

            // Add the new duo
            var duo = new Duo
            {
                Id1 = newDuo.Id1.Value,
                Id2 = newDuo.Id2.Value,
                Name = newDuo.Name,
                AltName = newDuo.AltName,
                Date = newDuo.Date
            };

            duosData.Duos.Add(duo);

            // Sort by id1, then by id2
            duosData.Duos = duosData.Duos
                .OrderBy(d => d.Id1)
                .ThenBy(d => d.Id2)
                .ToList();

            // Write back to file with proper formatting
            var writeOptions = new JsonSerializerOptions 
            { 
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            var updatedJson = JsonSerializer.Serialize(duosData, writeOptions);
            await System.IO.File.WriteAllTextAsync(_duosFilePath, updatedJson);

            _logger.LogInformation("Successfully added new duo: {Name}", newDuo.Name);
            return Ok(new { message = "Duo added successfully!", duo });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding duo");
            return StatusCode(500, new { error = "Failed to add duo" });
        }
    }
}

// DTOs
public class DuoRequest
{
    [JsonPropertyName("id1")]
    public int? Id1 { get; set; }
    
    [JsonPropertyName("id2")]
    public int? Id2 { get; set; }
    
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [JsonPropertyName("altName")]
    public string? AltName { get; set; }
    
    [JsonPropertyName("date")]
    public string? Date { get; set; }
}

public class Duo
{
    [JsonPropertyName("id1")]
    public int Id1 { get; set; }
    
    [JsonPropertyName("id2")]
    public int Id2 { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("altName")]
    public string? AltName { get; set; }
    
    [JsonPropertyName("date")]
    public string? Date { get; set; }
}

public class DuosData
{
    [JsonPropertyName("duos")]
    public List<Duo> Duos { get; set; } = new();
}

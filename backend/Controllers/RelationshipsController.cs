using Microsoft.AspNetCore.Mvc;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CharacterSelectAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RelationshipsController : ControllerBase
{
    private readonly string _relationshipsFilePath;
    private readonly ILogger<RelationshipsController> _logger;

    public RelationshipsController(ILogger<RelationshipsController> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        _relationshipsFilePath = Path.Combine(env.ContentRootPath, "..", "src", "assets", "data", "relationships.json");
    }

    [HttpGet]
    public async Task<IActionResult> GetRelationships()
    {
        try
        {
            await EnsureRelationshipsFileExists();
            var jsonData = await System.IO.File.ReadAllTextAsync(_relationshipsFilePath);
            var relationshipsData = JsonSerializer.Deserialize<JsonElement>(jsonData);
            return Ok(relationshipsData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading relationships.json");
            return StatusCode(500, new { error = "Failed to read relationships" });
        }
    }

    [HttpPut]
    public async Task<IActionResult> UpdateRelationship([FromBody] RelationshipRequest relationshipUpdate)
    {
        try
        {
            if (!relationshipUpdate.Id1.HasValue || !relationshipUpdate.Id2.HasValue)
            {
                return BadRequest(new { error = "Missing required fields: id1, id2" });
            }

            await EnsureRelationshipsFileExists();
            var jsonData = await System.IO.File.ReadAllTextAsync(_relationshipsFilePath);
            var relationshipsData = JsonSerializer.Deserialize<RelationshipsData>(jsonData);

            if (relationshipsData?.Relationships == null)
            {
                return StatusCode(500, new { error = "Invalid relationships data structure" });
            }

            var id1 = Math.Min(relationshipUpdate.Id1.Value, relationshipUpdate.Id2.Value);
            var id2 = Math.Max(relationshipUpdate.Id1.Value, relationshipUpdate.Id2.Value);
            var existingRelationship = relationshipsData.Relationships.FirstOrDefault(relationship =>
                relationship.Id1 == id1 && relationship.Id2 == id2);
            var id1ToId2Emoji = string.IsNullOrWhiteSpace(relationshipUpdate.Id1ToId2Emoji)
                ? null
                : relationshipUpdate.Id1ToId2Emoji.Trim();
            var id2ToId1Emoji = string.IsNullOrWhiteSpace(relationshipUpdate.Id2ToId1Emoji)
                ? null
                : relationshipUpdate.Id2ToId1Emoji.Trim();

            if (id1ToId2Emoji == null && id2ToId1Emoji == null)
            {
                if (existingRelationship != null)
                {
                    relationshipsData.Relationships.Remove(existingRelationship);
                }
            }
            else if (existingRelationship == null)
            {
                relationshipsData.Relationships.Add(new Relationship
                {
                    Id1 = id1,
                    Id2 = id2,
                    Id1ToId2Emoji = id1ToId2Emoji,
                    Id2ToId1Emoji = id2ToId1Emoji
                });
            }
            else
            {
                existingRelationship.Id1ToId2Emoji = id1ToId2Emoji;
                existingRelationship.Id2ToId1Emoji = id2ToId1Emoji;
            }

            relationshipsData.Relationships = relationshipsData.Relationships
                .OrderBy(relationship => relationship.Id1)
                .ThenBy(relationship => relationship.Id2)
                .ToList();

            var writeOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            var updatedJson = JsonSerializer.Serialize(relationshipsData, writeOptions);
            await System.IO.File.WriteAllTextAsync(_relationshipsFilePath, updatedJson);

            _logger.LogInformation("Successfully updated relationship: {Id1}-{Id2}", id1, id2);
            return Ok(new { message = "Relationship updated successfully!", relationships = relationshipsData.Relationships });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating relationship");
            return StatusCode(500, new { error = "Failed to update relationship" });
        }
    }

    private async Task EnsureRelationshipsFileExists()
    {
        if (System.IO.File.Exists(_relationshipsFilePath))
        {
            return;
        }

        var directory = Path.GetDirectoryName(_relationshipsFilePath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await System.IO.File.WriteAllTextAsync(_relationshipsFilePath, "{\n  \"relationships\": []\n}");
    }
}

public class RelationshipRequest
{
    [JsonPropertyName("id1")]
    public int? Id1 { get; set; }

    [JsonPropertyName("id2")]
    public int? Id2 { get; set; }

    [JsonPropertyName("id1ToId2Emoji")]
    public string? Id1ToId2Emoji { get; set; }

    [JsonPropertyName("id2ToId1Emoji")]
    public string? Id2ToId1Emoji { get; set; }
}

public class Relationship
{
    [JsonPropertyName("id1")]
    public int Id1 { get; set; }

    [JsonPropertyName("id2")]
    public int Id2 { get; set; }

    [JsonPropertyName("id1ToId2Emoji")]
    public string? Id1ToId2Emoji { get; set; }

    [JsonPropertyName("id2ToId1Emoji")]
    public string? Id2ToId1Emoji { get; set; }
}

public class RelationshipsData
{
    [JsonPropertyName("relationships")]
    public List<Relationship> Relationships { get; set; } = new();
}

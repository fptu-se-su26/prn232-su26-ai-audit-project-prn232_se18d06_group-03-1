using Microsoft.AspNetCore.Mvc;

namespace CookingCommunicate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
}

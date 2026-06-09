using AutoMapper;
using MoveVN.Application.Modules.Auth.DTOs;
using MoveVN.Application.Modules.Users.DTOs;
using MoveVN.Domain.Entities;

namespace MoveVN.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, AuthUserResponse>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Roles, opt => opt.Ignore());

        CreateMap<User, UserResponse>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id));
    }
}

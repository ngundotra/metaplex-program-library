//! Error types

use num_derive::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

/// Errors that may be returned by the Metadata program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum MetadataError {
    /// 0 Failed to unpack instruction data
    #[error("Failed to unpack instruction data")]
    InstructionUnpackError,

    /// Failed to pack instruction data
    #[error("Failed to pack instruction data")]
    InstructionPackError,

    /// Lamport balance below rent-exempt threshold.
    #[error("Lamport balance below rent-exempt threshold")]
    NotRentExempt,

    /// Already initialized
    #[error("Already initialized")]
    AlreadyInitialized,

    /// Uninitialized
    #[error("Uninitialized")]
    Uninitialized,

    ///  Metadata's key must match seed of ['metadata', program id, mint] provided
    #[error(" Metadata's key must match seed of ['metadata', program id, mint] provided")]
    InvalidMetadataKey,

    ///  Edition's key must match seed of ['metadata', program id, name, 'edition'] provided
    #[error("Edition's key must match seed of ['metadata', program id, name, 'edition'] provided")]
    InvalidEditionKey,

    /// Update Authority given does not match
    #[error("Update Authority given does not match")]
    UpdateAuthorityIncorrect,

    /// Update Authority needs to be signer to update metadata
    #[error("Update Authority needs to be signer to update metadata")]
    UpdateAuthorityIsNotSigner,

    /// You must be the mint authority and signer on this transaction
    #[error("You must be the mint authority and signer on this transaction")]
    NotMintAuthority,

    /// 10 - Mint authority provided does not match the authority on the mint
    #[error("Mint authority provided does not match the authority on the mint")]
    InvalidMintAuthority,

    /// Name too long
    #[error("Name too long")]
    NameTooLong,

    /// Symbol too long
    #[error("Symbol too long")]
    SymbolTooLong,

    /// URI too long
    #[error("URI too long")]
    UriTooLong,

    /// Update authority must be equivalent to the metadata's authority and also signer of this transaction
    #[error("Update authority must be equivalent to the metadata's authority and also signer of this transaction")]
    UpdateAuthorityMustBeEqualToMetadataAuthorityAndSigner,

    /// Mint given does not match mint on Metadata
    #[error("Mint given does not match mint on Metadata")]
    MintMismatch,

    /// Editions must have exactly one token
    #[error("Editions must have exactly one token")]
    EditionsMustHaveExactlyOneToken,

    /// Maximum editions printed already
    #[error("Maximum editions printed already")]
    MaxEditionsMintedAlready,

    /// Token mint to failed
    #[error("Token mint to failed")]
    TokenMintToFailed,

    /// The master edition record passed must match the master record on the edition given
    #[error("The master edition record passed must match the master record on the edition given")]
    MasterRecordMismatch,

    /// 20 - The destination account does not have the right mint
    #[error("The destination account does not have the right mint")]
    DestinationMintMismatch,

    /// An edition can only mint one of its kind!
    #[error("An edition can only mint one of its kind!")]
    EditionAlreadyMinted,

    /// Printing mint decimals should be zero
    #[error("Printing mint decimals should be zero")]
    PrintingMintDecimalsShouldBeZero,

    /// OneTimePrintingAuthorizationMint mint decimals should be zero
    #[error("OneTimePrintingAuthorization mint decimals should be zero")]
    OneTimePrintingAuthorizationMintDecimalsShouldBeZero,

    /// Edition mint decimals should be zero
    #[error("EditionMintDecimalsShouldBeZero")]
    EditionMintDecimalsShouldBeZero,

    /// Token burn failed
    #[error("Token burn failed")]
    TokenBurnFailed,

    /// The One Time authorization mint does not match that on the token account!
    #[error("The One Time authorization mint does not match that on the token account!")]
    TokenAccountOneTimeAuthMintMismatch,

    /// Derived key invalid
    #[error("Derived key invalid")]
    DerivedKeyInvalid,

    /// The Printing mint does not match that on the master edition!
    #[error("The Printing mint does not match that on the master edition!")]
    PrintingMintMismatch,

    /// The  One Time Printing Auth mint does not match that on the master edition!
    #[error("The One Time Printing Auth mint does not match that on the master edition!")]
    OneTimePrintingAuthMintMismatch,

    /// 30 - The mint of the token account does not match the Printing mint!
    #[error("The mint of the token account does not match the Printing mint!")]
    TokenAccountMintMismatch,

    /// The mint of the token account does not match the master metadata mint!
    #[error("The mint of the token account does not match the master metadata mint!")]
    TokenAccountMintMismatchV2,

    /// Not enough tokens to mint a limited edition
    #[error("Not enough tokens to mint a limited edition")]
    NotEnoughTokens,

    /// The mint on your authorization token holding account does not match your Printing mint!
    #[error(
        "The mint on your authorization token holding account does not match your Printing mint!"
    )]
    PrintingMintAuthorizationAccountMismatch,

    /// The authorization token account has a different owner than the update authority for the master edition!
    #[error("The authorization token account has a different owner than the update authority for the master edition!")]
    AuthorizationTokenAccountOwnerMismatch,

    /// This feature is currently disabled.
    #[error("This feature is currently disabled.")]
    Disabled,

    /// Creators list too long
    #[error("Creators list too long")]
    CreatorsTooLong,

    /// Creators must be at least one if set
    #[error("Creators must be at least one if set")]
    CreatorsMustBeAtleastOne,

    /// If using a creators array, you must be one of the creators listed
    #[error("If using a creators array, you must be one of the creators listed")]
    MustBeOneOfCreators,

    /// This metadata does not have creators
    #[error("This metadata does not have creators")]
    NoCreatorsPresentOnMetadata,

    /// 40 - This creator address was not found
    #[error("This creator address was not found")]
    CreatorNotFound,

    /// Basis points cannot be more than 10000
    #[error("Basis points cannot be more than 10000")]
    InvalidBasisPoints,

    /// Primary sale can only be flipped to true and is immutable
    #[error("Primary sale can only be flipped to true and is immutable")]
    PrimarySaleCanOnlyBeFlippedToTrue,

    /// Owner does not match that on the account given
    #[error("Owner does not match that on the account given")]
    OwnerMismatch,

    /// This account has no tokens to be used for authorization
    #[error("This account has no tokens to be used for authorization")]
    NoBalanceInAccountForAuthorization,

    /// Share total must equal 100 for creator array
    #[error("Share total must equal 100 for creator array")]
    ShareTotalMustBe100,

    /// This reservation list already exists!
    #[error("This reservation list already exists!")]
    ReservationExists,

    /// This reservation list does not exist!
    #[error("This reservation list does not exist!")]
    ReservationDoesNotExist,

    /// This reservation list exists but was never set with reservations
    #[error("This reservation list exists but was never set with reservations")]
    ReservationNotSet,

    /// This reservation list has already been set!
    #[error("This reservation list has already been set!")]
    ReservationAlreadyMade,

    /// 50 - Provided more addresses than max allowed in single reservation
    #[error("Provided more addresses than max allowed in single reservation")]
    BeyondMaxAddressSize,

    /// NumericalOverflowError
    #[error("NumericalOverflowError")]
    NumericalOverflowError,

    /// This reservation would go beyond the maximum supply of the master edition!
    #[error("This reservation would go beyond the maximum supply of the master edition!")]
    ReservationBreachesMaximumSupply,

    /// Address not in reservation!
    #[error("Address not in reservation!")]
    AddressNotInReservation,

    /// You cannot unilaterally verify another creator, they must sign
    #[error("You cannot unilaterally verify another creator, they must sign")]
    CannotVerifyAnotherCreator,

    /// You cannot unilaterally unverify another creator
    #[error("You cannot unilaterally unverify another creator")]
    CannotUnverifyAnotherCreator,

    /// In initial reservation setting, spots remaining should equal total spots
    #[error("In initial reservation setting, spots remaining should equal total spots")]
    SpotMismatch,

    /// Incorrect account owner
    #[error("Incorrect account owner")]
    IncorrectOwner,

    /// printing these tokens would breach the maximum supply limit of the master edition
    #[error("printing these tokens would breach the maximum supply limit of the master edition")]
    PrintingWouldBreachMaximumSupply,

    /// Data is immutable
    #[error("Data is immutable")]
    DataIsImmutable,

    /// 60 - No duplicate creator addresses
    #[error("No duplicate creator addresses")]
    DuplicateCreatorAddress,

    /// Reservation spots remaining should match total spots when first being created
    #[error("Reservation spots remaining should match total spots when first being created")]
    ReservationSpotsRemainingShouldMatchTotalSpotsAtStart,

    /// Invalid token program
    #[error("Invalid token program")]
    InvalidTokenProgram,

    /// Data type mismatch
    #[error("Data type mismatch")]
    DataTypeMismatch,

    /// Beyond alotted address size in reservation!
    #[error("Beyond alotted address size in reservation!")]
    BeyondAlottedAddressSize,

    /// The reservation has only been partially alotted
    #[error("The reservation has only been partially alotted")]
    ReservationNotComplete,

    /// You cannot splice over an existing reservation!
    #[error("You cannot splice over an existing reservation!")]
    TriedToReplaceAnExistingReservation,

    /// Invalid operation
    #[error("Invalid operation")]
    InvalidOperation,

    /// Invalid owner
    #[error("Invalid Owner")]
    InvalidOwner,

    /// Printing mint supply must be zero for conversion
    #[error("Printing mint supply must be zero for conversion")]
    PrintingMintSupplyMustBeZeroForConversion,

    /// 70 - One Time Auth mint supply must be zero for conversion
    #[error("One Time Auth mint supply must be zero for conversion")]
    OneTimeAuthMintSupplyMustBeZeroForConversion,

    /// You tried to insert one edition too many into an edition mark pda
    #[error("You tried to insert one edition too many into an edition mark pda")]
    InvalidEditionIndex,

    // In the legacy system the reservation needs to be of size one for cpu limit reasons
    #[error("In the legacy system the reservation needs to be of size one for cpu limit reasons")]
    ReservationArrayShouldBeSizeOne,

    /// Is Mutable can only be flipped to false
    #[error("Is Mutable can only be flipped to false")]
    IsMutableCanOnlyBeFlippedToFalse,

    #[error("Cannont Verify Collection in this Instruction")]
    CollectionCannotBeVerifiedInThisInstruction,

    #[error("This instruction was deprecated in a previous release and is now removed")]
    Removed, //For the curious we cannot get rid of an instruction in the enum or move them or it will break our api, this is a friendly way to get rid of them

    #[error("This token use method is burn and there are no remaining uses, it must be burned")]
    MustBeBurned,

    #[error("This use method is invalid")]
    InvalidUseMethod,

    #[error("Cannot Change Use Method after the first use")]
    CannotChangeUseMethodAfterFirstUse,

    #[error("Cannot Change Remaining or Available uses after the first use")]
    CannotChangeUsesAfterFirstUse,

    // 80
    #[error("Collection Not Found on Metadata")]
    CollectionNotFound,

    #[error("Collection Update Authority is invalid")]
    InvalidCollectionUpdateAuthority,

    #[error("Collection Must Be a Unique Master Edition v2")]
    CollectionMustBeAUniqueMasterEdition,

    #[error("The Use Authority Record Already Exists, to modify it Revoke, then Approve")]
    UseAuthorityRecordAlreadyExists,

    #[error("The Use Authority Record is empty or already revoked")]
    UseAuthorityRecordAlreadyRevoked,

    #[error("This token has no uses")]
    Unusable,

    #[error("There are not enough Uses left on this token.")]
    NotEnoughUses,

    #[error("This Collection Authority Record Already Exists.")]
    CollectionAuthorityRecordAlreadyExists,

    #[error("This Collection Authority Record Does Not Exist.")]
    CollectionAuthorityDoesNotExist,

    #[error("This Use Authority Record is invalid.")]
    InvalidUseAuthorityRecord,

    // 90
    #[error("This Collection Authority Record is invalid.")]
    InvalidCollectionAuthorityRecord,

    #[error("Metadata does not match the freeze authority on the mint")]
    InvalidFreezeAuthority,

    #[error("All tokens in this account have not been delegated to this user.")]
    InvalidDelegate,

    #[error("Creator can not be adjusted once they are verified.")]
    CannotAdjustVerifiedCreator,

    #[error("Verified creators cannot be removed.")]
    CannotRemoveVerifiedCreator,

    #[error("Can not wipe verified creators.")]
    CannotWipeVerifiedCreators,

    #[error("Not allowed to change seller fee basis points.")]
    NotAllowedToChangeSellerFeeBasisPoints,

    /// Edition override cannot be zero
    #[error("Edition override cannot be zero")]
    EditionOverrideCannotBeZero,

    #[error("Invalid User")]
    InvalidUser,

    /// Revoke Collection Authority signer is incorrect
    #[error("Revoke Collection Authority signer is incorrect")]
    RevokeCollectionAuthoritySignerIncorrect,

    // 100
    #[error("Token close failed")]
    TokenCloseFailed,

    /// 101 - Calling v1.3 function on unsized collection
    #[error("Can't use this function on unsized collection")]
    UnsizedCollection,

    /// 102 - Calling v1.2 function on a sized collection
    #[error("Can't use this function on a sized collection")]
    SizedCollection,

    /// 103 - Can't burn a verified member of a collection w/o providing collection metadata account
    #[error(
        "Can't burn a verified member of a collection w/o providing collection metadata account"
    )]
    MissingCollectionMetadata,

    /// 104 - This NFT is not a member of the specified collection.
    #[error("This NFT is not a member of the specified collection.")]
    NotAMemberOfCollection,

    /// 105 - This NFT is not a verified member of the specified collection.
    #[error("This NFT is not a verified member of the specified collection.")]
    NotVerifiedMemberOfCollection,

    /// 106 - This NFT is not a collection parent NFT.
    #[error("This NFT is not a collection parent NFT.")]
    NotACollectionParent,

    /// 107 - Could not determine a TokenStandard type.
    #[error("Could not determine a TokenStandard type.")]
    CouldNotDetermineTokenStandard,

    /// 108 - Missing edition account for a non-fungible token type.
    #[error("This mint account has an edition but none was provided.")]
    MissingEditionAccount,

    /// 109 - Not a Master Edition
    #[error("This edition is not a Master Edition")]
    NotAMasterEdition,

    /// 110 - Master Edition has prints.
    #[error("This Master Edition has existing prints")]
    MasterEditionHasPrints,

    /// 111 - Borsh Deserialization Error
    #[error("Borsh Deserialization Error")]
    BorshDeserializationError,

    /// 112 - Cannot update a verified colleciton in this command
    #[error("Cannot update a verified colleciton in this command")]
    CannotUpdateVerifiedCollection,

    /// 113 - Edition Account Doesnt Match Collection
    #[error("Edition account doesnt match collection ")]
    CollectionMasterEditionAccountInvalid,

    /// 114 - Item is already verified.
    #[error("Item is already verified.")]
    AlreadyVerified,

    /// 115 - Item is already unverified.
    #[error("Item is already unverified.")]
    AlreadyUnverified,

    /// 116 - Not a Print Edition
    #[error("This edition is not a Print Edition")]
    NotAPrintEdition,

    /// 117 - Invalid Edition Marker
    #[error("Invalid Master Edition")]
    InvalidMasterEdition,

    /// 118 - Invalid Edition Marker
    #[error("Invalid Print Edition")]
    InvalidPrintEdition,

    /// 119 - Invalid Edition Marker
    #[error("Invalid Edition Marker")]
    InvalidEditionMarker,

    /// 120 - Reservation List is Deprecated
    #[error("Reservation List is Deprecated")]
    ReservationListDeprecated,

    /// 121 - Print Edition doesn't match Master Edition
    #[error("Print Edition does not match Master Edition")]
    PrintEditionDoesNotMatchMasterEdition,

    /// 122 - Edition Number greater than max supply
    #[error("Edition Number greater than max supply")]
    EditionNumberGreaterThanMaxSupply,

    /// 123 - Must unverify before migrating collections.
    #[error("Must unverify before migrating collections.")]
    MustUnverify,
}

impl PrintProgramError for MetadataError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<MetadataError> for ProgramError {
    fn from(e: MetadataError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for MetadataError {
    fn type_of() -> &'static str {
        "Metadata Error"
    }
}

import { AeSdk, CompilerHttp, Node, MemoryAccount } from "@aeternity/aepp-sdk";

const ACCOUNT_SECRET_KEY =
    "9ebd7beda0c79af72a42ece3821a56eff16359b6df376cf049aee995565f022f840c974b97164776454ba119d84edc4d6058a8dec92b6edc578ab2d30b4c4200";
const NODE_URL = "https://testnet.aeternity.io";
const COMPILER_URL = "https://v7.compiler.aepps.com";

const account = new MemoryAccount(ACCOUNT_SECRET_KEY);
const node = new Node(NODE_URL);
const aeSdk = new AeSdk({
    nodes: [{ name: "testnet", instance: node }],
    accounts: [account],
    onCompiler: new CompilerHttp(COMPILER_URL),
});

const cd = `@compiler >= 6

include "String.aes"

contract TicTacToe =

  type state = map(int, int)

  entrypoint init() : state = { [11] = 0, [12] = 0, [13] = 0,
                                [21] = 0, [22] = 0, [23] = 0,
                                [31] = 0, [32] = 0, [33] = 0,
                                [00] = 0, // last player move info
                                [01] = 0 } // counter

  stateful entrypoint make_move(position, player) : string =
    // check if given player is only either 1 or 2 
    require(player == 1 || player == 2, "Invalid player!")
    // check if the position is correct
    let x = position mod 10
    let y = position / 10
    require(x > 0 && x < 4 && y > 0 && y < 4, "Incorrect position!")
  
    // check if it's your turn
    let concat = String.concat(Int.to_str(opposite_player(player))," has to play now!")
    let sentence  = String.concat("It's not your turn! Player ", concat)
    require(state[00] == 0 || state[00] == opposite_player(player), sentence)
     
    // check if the position is free
    require((state[position] == 0), "Place is already taken!")

    // set the player turn in the state
    put(state{[position] = player, [00] = player, [01] = state[01] + 1})

    // check if the player win
    check_win(position, player)

  function opposite_player(player) : int =
    switch(player)
      1 => 2
      2 => 1

  function check_win(position, player) : string =
    if(position == 11)
      if(state[11] == player && state[12] == player && state[13] == player)
        winner_msg(player)
      elif(state[11] == player && state[21] == player && state[31] == player)
        winner_msg(player)
      elif(state[11] == player && state[22] == player && state[33] == player)
        winner_msg(player)
      else
        check_free_space()
        
    elif(position == 12)
      if(state[12] == player && state[11] == player && state[13] == player)
        winner_msg(player)
      elif(state[12] == player && state[22] == player && state[32] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 13)
      if(state[13] == player && state[12] == player && state[11] == player)
        winner_msg(player)
      elif(state[13] == player && state[23] == player && state[33] == player)
        winner_msg(player)
      elif(state[13] == player && state[22] == player && state[31] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 21)
      if(state[21] == player && state[11] == player && state[31] == player)
        winner_msg(player)
      elif(state[21] == player && state[22] == player && state[23] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 22)
      if(state[22] == player && state[21] == player && state[23] == player)
        winner_msg(player)
      elif(state[22] == player && state[12] == player && state[32] == player)
        winner_msg(player)
      elif(state[22] == player && state[11] == player && state[33] == player)
        winner_msg(player)
      elif(state[22] == player && state[13] == player && state[31] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 23)
      if(state[23] == player && state[13] == player && state[31] == player)
        winner_msg(player)
      elif(state[23] == player && state[22] == player && state[21] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 31)
      if(state[31] == player && state[21] == player && state[11] == player)
        winner_msg(player)
      elif(state[31] == player && state[32] == player && state[33] == player)
        winner_msg(player)
      elif(state[31] == player && state[22] == player && state[13] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 32)
      if(state[32] == player && state[31] == player && state[33] == player)
        winner_msg(player)
      elif(state[32] == player && state[22] == player && state[12] == player)
        winner_msg(player)
      else
        check_free_space()

    elif(position == 33)
      if(state[33] == player && state[32] == player && state[31] == player)
        winner_msg(player)
      elif(state[33] == player && state[23] == player && state[13] == player)
        winner_msg(player)
      elif(state[33] == player && state[22] == player && state[11] == player)
        winner_msg(player)
      else
        "Game continues. The other player's turn."
    else
      "Position does not exist!"
  
  function winner_msg(player : int) : string = 
    String.concat("You are the winner! Congratulations player ", Int.to_str(player))
  
  function check_free_space() : string =
    if(state[01] == 9)
      "Game is over. Nobody won!"
    else
      "Game continues. The other player's turn."`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    console.log(code);

    const contract = await aeSdk.initializeContract({
        sourceCode: code || cd,
    });

    const bytecode = await contract.$compile();
    console.log(`Obtained bytecode ${bytecode}`);

    //@ts-ignore
    const deployInfo = await contract.$deploy([]);
    console.log(`Contract deployed at ${deployInfo.address}`);

    return Response.json({ address: deployInfo.address });
}
